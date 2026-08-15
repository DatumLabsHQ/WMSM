/**
 * SIC codes, and what they are worth.
 *
 * Two jobs: decide whether a Companies House row is even a candidate, and guess
 * which of the six sectors it belongs to. Both are guesses — SIC is self-declared
 * at incorporation and frequently never updated — so nothing here publishes
 * anything. It orders a review queue.
 */

/** The region we cover, by postcode area. Anything else is not ours. */
export const WM_POSTCODE_AREAS = ['B', 'CV', 'DY', 'WS', 'WV'] as const;

/**
 * A full UK postcode: outward (A9, A99, AA9, AA99, A9A, AA9A) then inward, which
 * is always digit-letter-letter.
 *
 * That last part matters more than it looks. Canadian postcodes are letter-digit-
 * letter digit-letter-digit, so "B3B 1N9" in Nova Scotia reads as area "B" if you
 * only glance at the front — which is exactly how a Halifax battery company turned
 * up in a Birmingham import. The inward pattern is what tells them apart.
 */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/;
/** Outward code alone, for sources that only publish the first half. */
const UK_OUTWARD = /^[A-Z]{1,2}\d[A-Z\d]?$/;

export function postcodeArea(postcode: string): string {
  return (postcode.trim().toUpperCase().match(/^[A-Z]{1,2}/)?.[0] ?? '').trim();
}

export function isUkPostcode(postcode: string): boolean {
  const clean = postcode.trim().toUpperCase();
  return UK_POSTCODE.test(clean) || UK_OUTWARD.test(clean);
}

export function inRegion(postcode: string): boolean {
  if (!isUkPostcode(postcode)) return false;
  return (WM_POSTCODE_AREAS as readonly string[]).includes(postcodeArea(postcode));
}

/**
 * SIC → our sector.
 *
 * Split into two tiers, learned the hard way. A first pass allowed any code that
 * looked adjacent to technology and produced 32,766 candidates whose highest
 * scorers were a nursing home, an electrician, a mortgage broker and a clothing
 * retailer that had filed 74100. Breadth without precision is not a queue, it is
 * a landfill.
 *
 * CORE codes are the ones a technology business actually files. A candidate must
 * have at least one, or it is not a candidate at all.
 *
 * SUPPORTING codes describe adjacent work — production, design, engineering,
 * finance — and are common in genuine startups but far more common in businesses
 * that are simply not this. They can decide which sector a company lands in, but
 * they can never get it into the queue on their own.
 */
export const CORE_SIC: Record<string, string | null> = {
  // Software and data
  '62011': 'games',
  '62012': null,
  '62020': null,
  '62030': null,
  '62090': null,
  '63110': null,
  '63120': null,
  '58210': 'games',
  '58290': null,

  // Electronics and instruments
  '26110': 'manufacturing',
  '26120': 'manufacturing',
  '26200': 'manufacturing',
  '26301': 'manufacturing',
  '26309': 'manufacturing',
  '26511': 'manufacturing',
  '26512': 'manufacturing',
  '26701': 'manufacturing',
  '30300': 'manufacturing',
  '28990': 'manufacturing',

  // Life sciences and medical technology
  '21100': 'health',
  '21200': 'health',
  '26600': 'health',
  '32500': 'health',
  '72110': 'health',

  // Research
  '72190': null,
};

/**
 * Adjacent codes. They colour a candidate that already qualifies; they never
 * qualify one. Deliberately excludes the codes that flooded the first pass —
 * 35110 caught every solar installer, 74100 every freelance designer, 86900 every
 * care home, 64999 every broker.
 */
export const SUPPORTING_SIC: Record<string, string> = {
  '59111': 'creative',
  '59112': 'creative',
  '59120': 'creative',
  '73110': 'creative',
  '74100': 'creative',
  '90030': 'creative',
  '18129': 'creative',
  '66190': 'fintech',
  '64191': 'fintech',
  '64921': 'fintech',
  '65120': 'fintech',
  '38320': 'cleantech',
  '35140': 'cleantech',
  '20590': 'cleantech',
  '27200': 'cleantech',
  '27900': 'cleantech',
  '25620': 'manufacturing',
  '28290': 'manufacturing',
  '28490': 'manufacturing',
  '29100': 'manufacturing',
  '29310': 'manufacturing',
  '33200': 'manufacturing',
  '71122': 'manufacturing',
  '86900': 'health',
};

export const SIC_SECTOR: Record<string, string> = {
  ...Object.fromEntries(Object.entries(CORE_SIC).filter(([, v]) => v) as [string, string][]),
  ...SUPPORTING_SIC,
};

export function sicCodesFrom(sicTexts: string[]): string[] {
  return sicTexts
    .map((t) => t.trim().match(/^(\d{4,5})/)?.[1] ?? '')
    .filter(Boolean);
}

/** The gate. No core code, no candidate. */
export function looksLikeTech(codes: string[]): boolean {
  return codes.some((c) => c in CORE_SIC);
}

/** True when the company's *first* filed code is a core one — a much stronger signal. */
export function coreIsPrimary(codes: string[]): boolean {
  return Boolean(codes[0] && codes[0] in CORE_SIC);
}

export function guessSector(codes: string[]): string | null {
  for (const code of codes) {
    const sector = CORE_SIC[code];
    if (sector) return sector;
  }
  for (const code of codes) {
    const sector = SUPPORTING_SIC[code];
    if (sector) return sector;
  }
  return null;
}

/** The generic codes a one-person contractor company almost always files. */
export const PSC_PRONE = new Set(['62020', '62090', '62012', '70229', '71122']);

/** "62012 - Business and domestic software development" → the readable half. */
export function sicLabel(sicText: string): string {
  return sicText.replace(/^\d{4,5}\s*-\s*/, '').trim();
}
