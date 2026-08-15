import 'server-only';
import { prisma } from '@/lib/db';
import { money, fullDate } from '@/lib/format';
import { readingMinutes, slugify } from '@/lib/markdown';

/**
 * A round already contains everything a short piece needs: who, how much, what
 * stage, which investors, and the surrounding context we hold anyway. This turns
 * one into a **draft** — never a published post. A person still reads it, adds the
 * paragraph only a person can write, and presses publish.
 *
 * Daily posting without daily writing; and nothing goes out unread.
 */

function draftBody(args: {
  companyName: string;
  blurb: string;
  about: string | null;
  sector: string;
  locality: string;
  authority: string;
  stage: string;
  amountGbp: number;
  investors: string;
  announced: Date;
  totalRaised: number;
  roundCount: number;
  openRoles: number;
  sectorPeers: number;
}): string {
  const investorList = args.investors
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const lead = investorList[0];
  const others = investorList.slice(1);

  const paragraphs = [
    `${args.companyName} has raised ${money(args.amountGbp)}${lead ? ` in a ${args.stage} round involving ${lead}` : ` at ${args.stage}`}${
      others.length ? `, with ${others.join(' and ')} alongside` : ''
    }. It was announced on ${fullDate(args.announced)}.`,
    '',
    '## What the company does',
    '',
    args.about ?? `${args.blurb}.`,
    '',
    '## Where it sits',
    '',
    `${args.companyName} is based in ${args.locality}, ${args.authority}, and is one of ${args.sectorPeers} ${args.sector.toLowerCase()} companies on this map.${
      args.roundCount > 1 ? ` This is its ${args.roundCount === 2 ? 'second' : `${args.roundCount}th`} recorded round; ${money(args.totalRaised)} in announced funding in total.` : ' It is the first round we have recorded for them.'
    }${args.openRoles ? ` They currently have ${args.openRoles} open ${args.openRoles === 1 ? 'role' : 'roles'} on the board.` : ''}`,
    '',
    '## TO WRITE',
    '',
    '- Why this round, why now — the thing the press release does not say.',
    '- What it means for the sector or the area, if anything.',
    '- Anything we cannot source: valuation, equity versus debt, customers.',
    '',
    '## What we do not know',
    '',
    'The round was announced, so we have logged it. We do not know the valuation or the split between equity and debt. If you can source more, tell us.',
  ];

  return paragraphs.join('\n');
}

export interface DraftResult {
  created: number;
  slugs: string[];
}

/** Rounds announced in the window that have no article attached yet. */
export async function draftFundingPosts(windowDays = 14): Promise<DraftResult> {
  const since = new Date(Date.now() - windowDays * 86_400_000);

  const rounds = await prisma.round.findMany({
    where: { announced: { gte: since }, company: { status: 'published' } },
    orderBy: { announced: 'desc' },
    include: {
      company: {
        include: {
          sector: { select: { label: true, id: true } },
          _count: { select: { jobs: true, rounds: true, articles: true } },
        },
      },
    },
  });

  const fundingTag = await prisma.tag.upsert({
    where: { slug: 'funding' },
    update: {},
    create: { slug: 'funding', label: 'Funding', blurb: 'Who raised what, from whom.' },
    select: { id: true },
  });

  const created: string[] = [];

  for (const round of rounds) {
    // One draft per round, and never for a company we have already covered here.
    const slug = slugify(`${round.company.name} raises ${money(round.amountGbp)} ${round.stage}`);
    const exists = await prisma.article.findUnique({ where: { slug } });
    if (exists) continue;

    const [totals, peers] = await Promise.all([
      prisma.round.aggregate({ where: { companyId: round.companyId }, _sum: { amountGbp: true } }),
      prisma.company.count({ where: { status: 'published', sectorId: round.company.sector.id } }),
    ]);

    const body = draftBody({
      companyName: round.company.name,
      blurb: round.company.blurb,
      about: round.company.about,
      sector: round.company.sector.label,
      locality: round.company.locality,
      authority: round.company.authority,
      stage: round.stage,
      amountGbp: round.amountGbp,
      investors: round.investors,
      announced: round.announced,
      totalRaised: totals._sum.amountGbp ?? round.amountGbp,
      roundCount: round.company._count.rounds,
      openRoles: round.company._count.jobs,
      sectorPeers: peers,
    });

    await prisma.article.create({
      data: {
        slug,
        title: `${round.company.name} raises ${money(round.amountGbp)} ${round.stage}`,
        excerpt: `${round.company.blurb}. ${money(round.amountGbp)} at ${round.stage}, announced ${fullDate(round.announced)}.`,
        body,
        kind: 'funding',
        status: 'draft',
        readMinutes: readingMinutes(body),
        companyId: round.companyId,
        tags: { create: [{ tagId: fundingTag.id }] },
      },
    });

    created.push(slug);
  }

  return { created: created.length, slugs: created };
}
