/**
 * Seed data for the West Midlands Startup Map.
 *
 * Geography is real: every lat/lng below is the actual place named. The companies,
 * rounds, salaries and roles are invented placeholders shaped like regional data —
 * they are not scraped facts. Replace them before this goes anywhere public.
 */
import { PrismaClient } from '../lib/prisma/generated/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const readingMinutes = (body: string) => Math.max(1, Math.round(body.trim().split(/\s+/).length / 220));

const SECTORS = [
  {
    id: 'fintech',
    slug: 'fintech',
    label: 'Fintech',
    colorVar: 'var(--sector-fintech)',
    icon: 'landmark',
    sortOrder: 1,
    blurb: 'Payments, lending and treasury tooling, mostly clustered on Colmore Row and around Brindleyplace.',
  },
  {
    id: 'health',
    slug: 'health',
    label: 'HealthTech',
    colorVar: 'var(--sector-health)',
    icon: 'heart-pulse',
    sortOrder: 2,
    blurb: 'Built next to the largest teaching hospital estate outside London. Most sell to trusts, not consumers.',
  },
  {
    id: 'manufacturing',
    slug: 'advanced-manufacturing',
    label: 'Advanced mfg',
    colorVar: 'var(--sector-manufacturing)',
    icon: 'factory',
    sortOrder: 3,
    blurb: 'Robotics, additive and shop-floor software, from Tyseley out to the Black Country trades.',
  },
  {
    id: 'games',
    slug: 'games',
    label: 'Games',
    colorVar: 'var(--sector-games)',
    icon: 'gamepad-2',
    sortOrder: 4,
    blurb: 'Silicon Spa. Leamington, Warwick and Coventry hold one of the densest studio clusters in Europe.',
  },
  {
    id: 'cleantech',
    slug: 'cleantech',
    label: 'Cleantech',
    colorVar: 'var(--sector-cleantech)',
    icon: 'leaf',
    sortOrder: 5,
    blurb: 'Batteries, grid and heat. Follows the automotive supply chain it is trying to replace.',
  },
  {
    id: 'creative',
    slug: 'creative',
    label: 'Creative',
    colorVar: 'var(--sector-creative)',
    icon: 'palette',
    sortOrder: 6,
    blurb: 'Production, post and brand, concentrated in Digbeth since the BBC moved in.',
  },
];

type SeedRound = { stage: string; amountGbp: number; announced: string; investors: string };
type SeedJob = {
  title: string;
  discipline: 'Engineering' | 'Commercial' | 'Ops' | 'Design';
  arrangement: 'Hybrid' | 'On-site' | 'Remote';
  salaryLabel: string;
  salaryFloor: number;
  postedAt: string;
};
type SeedCompany = {
  slug: string;
  name: string;
  blurb: string;
  about?: string;
  sectorId: string;
  stage: string;
  headcount: string;
  headcountNum: number;
  locality: string;
  postcode: string;
  authority: string;
  lat: number;
  lng: number;
  founded: number;
  raisedGbp: number;
  website?: string;
  hiring?: boolean;
  verified?: boolean;
  claimed?: boolean;
  rounds?: SeedRound[];
  jobs?: SeedJob[];
};

const COMPANIES: SeedCompany[] = [
  {
    slug: 'ledgerly',
    name: 'Ledgerly',
    blurb: 'Treasury tooling for mid-market finance teams',
    about:
      'Cash forecasting and bank reconciliation for companies too big for a spreadsheet and too small for a treasury department. Sells mainly into manufacturing and logistics.',
    sectorId: 'fintech',
    stage: 'Series A',
    headcount: '51–200',
    headcountNum: 78,
    locality: 'Colmore Row',
    postcode: 'B3 2QD',
    authority: 'Birmingham',
    lat: 52.4816,
    lng: -1.8998,
    founded: 2017,
    raisedGbp: 18_400_000,
    website: 'ledgerly.io',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Series A extension', amountGbp: 6_000_000, announced: '2026-06-28', investors: 'Praetura · BGF' },
      { stage: 'Series A', amountGbp: 9_500_000, announced: '2024-03-14', investors: 'BGF · Midven' },
      { stage: 'Seed', amountGbp: 2_900_000, announced: '2021-09-02', investors: 'Midven · angels' },
    ],
    jobs: [
      { title: 'Senior Platform Engineer', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£70–85k', salaryFloor: 70000, postedAt: '2026-08-09' },
      { title: 'Staff Backend Engineer', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£85–100k', salaryFloor: 85000, postedAt: '2026-08-04' },
      { title: 'Account Executive, Mid-market', discipline: 'Commercial', arrangement: 'Hybrid', salaryLabel: '£55k + OTE', salaryFloor: 55000, postedAt: '2026-07-30' },
      { title: 'Product Designer', discipline: 'Design', arrangement: 'Hybrid', salaryLabel: '£58–70k', salaryFloor: 58000, postedAt: '2026-07-22' },
    ],
  },
  {
    slug: 'canal-and-code',
    name: 'Canal & Code',
    blurb: 'Open banking rails for credit unions',
    about: 'Account aggregation and affordability checks for the 40-odd credit unions across the region.',
    sectorId: 'fintech',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 24,
    locality: 'Brindleyplace',
    postcode: 'B1 2HL',
    authority: 'Birmingham',
    lat: 52.479,
    lng: -1.913,
    founded: 2021,
    raisedGbp: 5_200_000,
    website: 'canalandcode.com',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [{ stage: 'Seed', amountGbp: 5_200_000, announced: '2025-11-11', investors: 'Ada Ventures · MEIF' }],
    jobs: [
      { title: 'Backend Engineer (Go)', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£60–72k', salaryFloor: 60000, postedAt: '2026-08-07' },
      { title: 'Compliance Manager', discipline: 'Ops', arrangement: 'Hybrid', salaryLabel: '£48–56k', salaryFloor: 48000, postedAt: '2026-07-18' },
    ],
  },
  {
    slug: 'forgepay',
    name: 'ForgePay',
    blurb: 'Payments for independent makers and jewellers',
    about: 'Card terminals and hallmark-aware invoicing for the Jewellery Quarter trade.',
    sectorId: 'fintech',
    stage: 'Pre-seed',
    headcount: '1–10',
    headcountNum: 6,
    locality: 'Jewellery Quarter',
    postcode: 'B18 6HQ',
    authority: 'Birmingham',
    lat: 52.488,
    lng: -1.913,
    founded: 2025,
    raisedGbp: 320_000,
    website: 'forgepay.uk',
    hiring: true,
    verified: false,
    rounds: [{ stage: 'Pre-seed', amountGbp: 320_000, announced: '2026-02-19', investors: 'Angels · SFC Capital' }],
    jobs: [{ title: 'Founding Engineer', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£55–65k + equity', salaryFloor: 55000, postedAt: '2026-08-01' }],
  },
  {
    slug: 'sett-underwriting',
    name: 'Sett Underwriting',
    blurb: 'Parametric cover for small manufacturers',
    sectorId: 'fintech',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 19,
    locality: 'Solihull',
    postcode: 'B91 3RX',
    authority: 'Solihull',
    lat: 52.4128,
    lng: -1.778,
    founded: 2022,
    raisedGbp: 3_400_000,
    website: 'sett.insure',
    hiring: false,
    verified: true,
    claimed: true,
    rounds: [{ stage: 'Seed', amountGbp: 3_400_000, announced: '2025-04-08', investors: 'Insurtech Gateway · Midven' }],
  },
  {
    slug: 'sparkbrook-savings',
    name: 'Sparkbrook Savings',
    blurb: 'Sharia-compliant savings for underbanked households',
    sectorId: 'fintech',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 15,
    locality: 'Sparkbrook',
    postcode: 'B11 1AR',
    authority: 'Birmingham',
    lat: 52.4574,
    lng: -1.8672,
    founded: 2023,
    raisedGbp: 1_800_000,
    website: 'sparkbrooksavings.co.uk',
    hiring: true,
    verified: true,
    rounds: [{ stage: 'Seed', amountGbp: 1_800_000, announced: '2026-01-27', investors: 'Fair by Design · MEIF' }],
    jobs: [{ title: 'Customer Operations Lead', discipline: 'Ops', arrangement: 'Hybrid', salaryLabel: '£38–45k', salaryFloor: 38000, postedAt: '2026-07-29' }],
  },
  {
    slug: 'rugby-rail-finance',
    name: 'Rugby Rail Finance',
    blurb: 'Asset finance for rolling-stock suppliers',
    sectorId: 'fintech',
    stage: 'Bootstrapped',
    headcount: '11–50',
    headcountNum: 22,
    locality: 'Rugby',
    postcode: 'CV21 2AA',
    authority: 'Warwickshire',
    lat: 52.3705,
    lng: -1.2647,
    founded: 2016,
    raisedGbp: 0,
    website: 'rugbyrailfinance.co.uk',
    verified: true,
    claimed: true,
  },

  {
    slug: 'medira',
    name: 'Medira',
    blurb: 'Pathology triage models for NHS labs',
    about: 'Queues slides by likely urgency so consultants see the worrying ones first. Deployed in two trusts.',
    sectorId: 'health',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 31,
    locality: 'Edgbaston',
    postcode: 'B15 2TT',
    authority: 'Birmingham',
    lat: 52.453,
    lng: -1.93,
    founded: 2021,
    raisedGbp: 3_800_000,
    website: 'medira.health',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Seed', amountGbp: 3_100_000, announced: '2025-02-11', investors: 'Ada Ventures · UoB Enterprise' },
      { stage: 'Grant', amountGbp: 700_000, announced: '2024-06-03', investors: 'Innovate UK' },
    ],
    jobs: [
      { title: 'ML Engineer, Imaging', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£65–78k', salaryFloor: 65000, postedAt: '2026-08-06' },
      { title: 'Clinical Affairs Manager', discipline: 'Ops', arrangement: 'Hybrid', salaryLabel: '£52–60k', salaryFloor: 52000, postedAt: '2026-07-25' },
      { title: 'Regulatory Lead (QMS)', discipline: 'Ops', arrangement: 'Remote', salaryLabel: '£60–70k', salaryFloor: 60000, postedAt: '2026-07-11' },
    ],
  },
  {
    slug: 'nhsloop',
    name: 'NHSLoop',
    blurb: 'Discharge coordination for acute trusts',
    about: 'Moves a patient discharge from a fax and three phone calls to one shared timeline across ward, social care and transport.',
    sectorId: 'health',
    stage: 'Series A',
    headcount: '51–200',
    headcountNum: 96,
    locality: 'Binley',
    postcode: 'CV3 2TH',
    authority: 'Coventry',
    lat: 52.421,
    lng: -1.464,
    founded: 2019,
    raisedGbp: 11_000_000,
    website: 'nhsloop.co.uk',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Series A', amountGbp: 8_500_000, announced: '2025-09-16', investors: 'AlbionVC · Praetura' },
      { stage: 'Seed', amountGbp: 2_500_000, announced: '2023-01-24', investors: 'Midven · angels' },
    ],
    jobs: [
      { title: 'Implementation Consultant', discipline: 'Ops', arrangement: 'Hybrid', salaryLabel: '£45–52k', salaryFloor: 45000, postedAt: '2026-08-10' },
      { title: 'Senior Frontend Engineer', discipline: 'Engineering', arrangement: 'Remote', salaryLabel: '£68–80k', salaryFloor: 68000, postedAt: '2026-08-03' },
      { title: 'NHS Partnerships Manager', discipline: 'Commercial', arrangement: 'Hybrid', salaryLabel: '£58k + OTE', salaryFloor: 58000, postedAt: '2026-07-27' },
    ],
  },
  {
    slug: 'ward-end-health',
    name: 'Ward End Health',
    blurb: 'Remote monitoring for community nursing',
    sectorId: 'health',
    stage: 'Pre-seed',
    headcount: '1–10',
    headcountNum: 5,
    locality: 'Ward End',
    postcode: 'B8 2SF',
    authority: 'Birmingham',
    lat: 52.497,
    lng: -1.83,
    founded: 2024,
    raisedGbp: 450_000,
    website: 'wardendhealth.uk',
    hiring: true,
    verified: false,
    rounds: [{ stage: 'Pre-seed', amountGbp: 450_000, announced: '2025-10-06', investors: 'SFC Capital · angels' }],
    jobs: [{ title: 'Clinical Lead (part-time)', discipline: 'Ops', arrangement: 'Remote', salaryLabel: '£300/day', salaryFloor: 0, postedAt: '2026-08-05' }],
  },
  {
    slug: 'selly-diagnostics',
    name: 'Selly Diagnostics',
    blurb: 'Point-of-care assays for antibiotic stewardship',
    sectorId: 'health',
    stage: 'Series A',
    headcount: '51–200',
    headcountNum: 62,
    locality: 'Selly Oak',
    postcode: 'B29 6SN',
    authority: 'Birmingham',
    lat: 52.4416,
    lng: -1.9375,
    founded: 2018,
    raisedGbp: 14_600_000,
    website: 'sellydx.com',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Series A', amountGbp: 12_000_000, announced: '2026-05-19', investors: 'Mercia · Legal & General' },
      { stage: 'Seed', amountGbp: 2_600_000, announced: '2022-11-30', investors: 'UoB Enterprise · Innovate UK' },
    ],
    jobs: [
      { title: 'Assay Development Scientist', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£42–50k', salaryFloor: 42000, postedAt: '2026-08-08' },
      { title: 'QA Technician', discipline: 'Ops', arrangement: 'On-site', salaryLabel: '£30–35k', salaryFloor: 30000, postedAt: '2026-07-15' },
    ],
  },
  {
    slug: 'nuneaton-care-os',
    name: 'Nuneaton Care OS',
    blurb: 'Rota and compliance software for domiciliary care',
    sectorId: 'health',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 27,
    locality: 'Nuneaton',
    postcode: 'CV11 5RY',
    authority: 'Warwickshire',
    lat: 52.523,
    lng: -1.468,
    founded: 2020,
    raisedGbp: 2_400_000,
    website: 'nuneatoncareos.co.uk',
    hiring: false,
    verified: true,
    claimed: true,
    rounds: [{ stage: 'Seed', amountGbp: 2_400_000, announced: '2024-09-12', investors: 'MEIF · angels' }],
  },
  {
    slug: 'halesowen-mobility',
    name: 'Halesowen Mobility',
    blurb: 'Powered wheelchair controls with fall detection',
    sectorId: 'health',
    stage: 'Bootstrapped',
    headcount: '11–50',
    headcountNum: 18,
    locality: 'Halesowen',
    postcode: 'B63 3BL',
    authority: 'Black Country',
    lat: 52.449,
    lng: -2.05,
    founded: 2013,
    raisedGbp: 0,
    website: 'halesowenmobility.com',
    verified: true,
  },

  {
    slug: 'kanda-robotics',
    name: 'Kanda Robotics',
    blurb: 'Pick-and-place cells for SME manufacturers',
    about:
      'Sells a robot cell that a shop-floor supervisor can retask in an afternoon, aimed at firms with fifty staff rather than five thousand.',
    sectorId: 'manufacturing',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 44,
    locality: 'Tyseley',
    postcode: 'B11 2AA',
    authority: 'Birmingham',
    lat: 52.4551,
    lng: -1.8452,
    founded: 2019,
    raisedGbp: 6_100_000,
    website: 'kandarobotics.co.uk',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Seed', amountGbp: 4_200_000, announced: '2026-07-12', investors: 'Ada Ventures · MEIF' },
      { stage: 'Pre-seed', amountGbp: 1_100_000, announced: '2023-05-09', investors: 'Midven' },
      { stage: 'Grant', amountGbp: 800_000, announced: '2022-02-15', investors: 'Innovate UK' },
    ],
    jobs: [
      { title: 'Controls Engineer', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£52–60k', salaryFloor: 52000, postedAt: '2026-08-07' },
      { title: 'Mechanical Design Engineer', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£45–55k', salaryFloor: 45000, postedAt: '2026-07-31' },
      { title: 'Field Service Technician', discipline: 'Ops', arrangement: 'On-site', salaryLabel: '£34–40k', salaryFloor: 34000, postedAt: '2026-07-24' },
      { title: 'Head of Sales', discipline: 'Commercial', arrangement: 'Hybrid', salaryLabel: '£75k + OTE', salaryFloor: 75000, postedAt: '2026-06-30' },
    ],
  },
  {
    slug: 'covbotics',
    name: 'Covbotics',
    blurb: 'Autonomous inspection for automotive lines',
    sectorId: 'manufacturing',
    stage: 'Series A',
    headcount: '51–200',
    headcountNum: 88,
    locality: 'Coventry',
    postcode: 'CV1 2TT',
    authority: 'Coventry',
    lat: 52.4068,
    lng: -1.5197,
    founded: 2018,
    raisedGbp: 14_000_000,
    website: 'covbotics.com',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Series A', amountGbp: 11_000_000, announced: '2025-06-24', investors: 'Mercia · BGF' },
      { stage: 'Seed', amountGbp: 3_000_000, announced: '2022-04-19', investors: 'Midven · WMG' },
    ],
    jobs: [
      { title: 'Computer Vision Engineer', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£62–75k', salaryFloor: 62000, postedAt: '2026-08-11' },
      { title: 'Robotics Integration Lead', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£58–68k', salaryFloor: 58000, postedAt: '2026-08-02' },
      { title: 'Bid Manager', discipline: 'Commercial', arrangement: 'Hybrid', salaryLabel: '£46–54k', salaryFloor: 46000, postedAt: '2026-07-20' },
    ],
  },
  {
    slug: 'walsall-works-os',
    name: 'Walsall Works OS',
    blurb: 'Shop-floor software for leather and metal trades',
    sectorId: 'manufacturing',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 21,
    locality: 'Walsall',
    postcode: 'WS1 1TP',
    authority: 'Black Country',
    lat: 52.586,
    lng: -1.982,
    founded: 2022,
    raisedGbp: 1_900_000,
    website: 'walsallworks.io',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [{ stage: 'Seed', amountGbp: 1_900_000, announced: '2025-08-14', investors: 'MEIF · Black Country LEP' }],
    jobs: [
      { title: 'Full-stack Engineer', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£48–58k', salaryFloor: 48000, postedAt: '2026-08-05' },
      { title: 'Customer Success Manager', discipline: 'Commercial', arrangement: 'On-site', salaryLabel: '£32–38k', salaryFloor: 32000, postedAt: '2026-07-17' },
    ],
  },
  {
    slug: 'stourvale-additive',
    name: 'Stourvale Additive',
    blurb: 'Metal 3D printing bureau for aerospace',
    sectorId: 'manufacturing',
    stage: 'Bootstrapped',
    headcount: '11–50',
    headcountNum: 34,
    locality: 'Stourbridge',
    postcode: 'DY8 4YN',
    authority: 'Black Country',
    lat: 52.457,
    lng: -2.144,
    founded: 2015,
    raisedGbp: 0,
    website: 'stourvale.com',
    verified: true,
    claimed: true,
  },
  {
    slug: 'longbridge-drivetrain',
    name: 'Longbridge Drivetrain',
    blurb: 'Retrofit electric drivetrains for light commercial fleets',
    sectorId: 'manufacturing',
    stage: 'Series A',
    headcount: '51–200',
    headcountNum: 71,
    locality: 'Longbridge',
    postcode: 'B31 2TW',
    authority: 'Birmingham',
    lat: 52.3946,
    lng: -1.9776,
    founded: 2017,
    raisedGbp: 19_300_000,
    website: 'longbridgedrivetrain.com',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Series A', amountGbp: 15_000_000, announced: '2026-03-05', investors: 'Legal & General · Mercia' },
      { stage: 'Seed', amountGbp: 4_300_000, announced: '2022-10-11', investors: 'Midven · Innovate UK' },
    ],
    jobs: [
      { title: 'Battery Systems Engineer', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£55–68k', salaryFloor: 55000, postedAt: '2026-08-09' },
      { title: 'Production Planner', discipline: 'Ops', arrangement: 'On-site', salaryLabel: '£36–43k', salaryFloor: 36000, postedAt: '2026-07-28' },
    ],
  },
  {
    slug: 'west-brom-tooling',
    name: 'West Brom Tooling',
    blurb: 'Digital tool-and-die for short-run pressings',
    sectorId: 'manufacturing',
    stage: 'Bootstrapped',
    headcount: '11–50',
    headcountNum: 29,
    locality: 'West Bromwich',
    postcode: 'B70 6NX',
    authority: 'Black Country',
    lat: 52.5187,
    lng: -1.9945,
    founded: 2011,
    raisedGbp: 0,
    website: 'westbromtooling.co.uk',
    hiring: true,
    verified: true,
    jobs: [{ title: 'CNC Programmer', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£38–46k', salaryFloor: 38000, postedAt: '2026-07-21' }],
  },
  {
    slug: 'smethwick-castings',
    name: 'Smethwick Castings AI',
    blurb: 'Defect prediction for foundry pours',
    sectorId: 'manufacturing',
    stage: 'Pre-seed',
    headcount: '1–10',
    headcountNum: 7,
    locality: 'Smethwick',
    postcode: 'B66 2NR',
    authority: 'Black Country',
    lat: 52.493,
    lng: -1.968,
    founded: 2025,
    raisedGbp: 280_000,
    website: 'smethwickcastings.ai',
    hiring: false,
    verified: false,
    rounds: [{ stage: 'Pre-seed', amountGbp: 280_000, announced: '2026-04-22', investors: 'SFC Capital' }],
  },
  {
    slug: 'aston-forge-labs',
    name: 'Aston Forge Labs',
    blurb: 'Hydrogen burner retrofits for industrial furnaces',
    sectorId: 'manufacturing',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 26,
    locality: 'Aston',
    postcode: 'B6 4DA',
    authority: 'Birmingham',
    lat: 52.506,
    lng: -1.888,
    founded: 2021,
    raisedGbp: 4_700_000,
    website: 'astonforge.com',
    hiring: true,
    verified: true,
    rounds: [{ stage: 'Seed', amountGbp: 4_700_000, announced: '2026-01-15', investors: 'Aston Uni Enterprise · Innovate UK' }],
    jobs: [{ title: 'Thermal Engineer', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£50–60k', salaryFloor: 50000, postedAt: '2026-08-06' }],
  },

  {
    slug: 'spa-loop-games',
    name: 'Spa Loop Games',
    blurb: 'Co-development studio, Silicon Spa',
    about: 'Ports and co-dev for console publishers. Grew out of two teams that left Codemasters in 2014.',
    sectorId: 'games',
    stage: 'Series B',
    headcount: '51–200',
    headcountNum: 164,
    locality: 'Leamington Spa',
    postcode: 'CV32 4RA',
    authority: 'Warwickshire',
    lat: 52.2905,
    lng: -1.535,
    founded: 2014,
    raisedGbp: 31_000_000,
    website: 'spaloop.games',
    hiring: false,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Series B', amountGbp: 22_000_000, announced: '2024-11-07', investors: 'Hiro Capital · BGF' },
      { stage: 'Series A', amountGbp: 9_000_000, announced: '2021-03-18', investors: 'Hiro Capital' },
    ],
  },
  {
    slug: 'leamlight',
    name: 'Leamlight',
    blurb: 'Original IP studio, ex-Codemasters leads',
    sectorId: 'games',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 38,
    locality: 'Leamington Spa',
    postcode: 'CV31 1DL',
    authority: 'Warwickshire',
    lat: 52.285,
    lng: -1.52,
    founded: 2020,
    raisedGbp: 4_500_000,
    website: 'leamlight.games',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [{ stage: 'Seed', amountGbp: 4_500_000, announced: '2025-05-21', investors: 'Hiro Capital · Sunny Side' }],
    jobs: [
      { title: 'Gameplay Programmer', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£48–66k', salaryFloor: 48000, postedAt: '2026-08-04' },
      { title: 'Senior Environment Artist', discipline: 'Design', arrangement: 'Hybrid', salaryLabel: '£45–58k', salaryFloor: 45000, postedAt: '2026-07-26' },
    ],
  },
  {
    slug: 'wolvesplay',
    name: 'WolvesPlay',
    blurb: 'Mobile sports management titles',
    sectorId: 'games',
    stage: 'Pre-seed',
    headcount: '1–10',
    headcountNum: 8,
    locality: 'Wolverhampton',
    postcode: 'WV2 4AH',
    authority: 'Black Country',
    lat: 52.58,
    lng: -2.12,
    founded: 2024,
    raisedGbp: 200_000,
    website: 'wolvesplay.gg',
    hiring: true,
    verified: false,
    rounds: [{ stage: 'Pre-seed', amountGbp: 200_000, announced: '2025-12-03', investors: 'Angels' }],
    jobs: [{ title: 'Unity Developer', discipline: 'Engineering', arrangement: 'Remote', salaryLabel: '£38–48k', salaryFloor: 38000, postedAt: '2026-08-08' }],
  },
  {
    slug: 'warwick-arcade',
    name: 'Warwick Arcade',
    blurb: 'Middleware for crossplay matchmaking',
    sectorId: 'games',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 23,
    locality: 'Warwick',
    postcode: 'CV34 4AB',
    authority: 'Warwickshire',
    lat: 52.2819,
    lng: -1.5849,
    founded: 2021,
    raisedGbp: 3_600_000,
    website: 'warwickarcade.dev',
    hiring: true,
    verified: true,
    rounds: [{ stage: 'Seed', amountGbp: 3_600_000, announced: '2026-02-04', investors: 'Hiro Capital · MEIF' }],
    jobs: [{ title: 'Network Engineer', discipline: 'Engineering', arrangement: 'Remote', salaryLabel: '£58–70k', salaryFloor: 58000, postedAt: '2026-07-30' }],
  },
  {
    slug: 'coventry-cabinet',
    name: 'Coventry Cabinet',
    blurb: 'Arcade-cabinet hardware for location-based VR',
    sectorId: 'games',
    stage: 'Bootstrapped',
    headcount: '1–10',
    headcountNum: 9,
    locality: 'Coventry',
    postcode: 'CV1 5FB',
    authority: 'Coventry',
    lat: 52.4083,
    lng: -1.5108,
    founded: 2019,
    raisedGbp: 0,
    website: 'coventrycabinet.com',
    verified: false,
  },
  {
    slug: 'stratford-story-lab',
    name: 'Stratford Story Lab',
    blurb: 'Narrative tools for episodic games',
    sectorId: 'games',
    stage: 'Pre-seed',
    headcount: '1–10',
    headcountNum: 6,
    locality: 'Stratford-upon-Avon',
    postcode: 'CV37 6YY',
    authority: 'Warwickshire',
    lat: 52.1917,
    lng: -1.7073,
    founded: 2024,
    raisedGbp: 175_000,
    website: 'stratfordstorylab.com',
    hiring: false,
    verified: false,
    rounds: [{ stage: 'Pre-seed', amountGbp: 175_000, announced: '2026-03-30', investors: 'Angels' }],
  },

  {
    slug: 'black-country-battery',
    name: 'Black Country Battery',
    blurb: 'Second-life cell packs for grid storage',
    about:
      'Takes automotive packs at end of vehicle life, grades the cells and rebuilds them into containerised storage for industrial sites.',
    sectorId: 'cleantech',
    stage: 'Series A',
    headcount: '51–200',
    headcountNum: 118,
    locality: 'Wolverhampton',
    postcode: 'WV1 3LX',
    authority: 'Black Country',
    lat: 52.5862,
    lng: -2.1288,
    founded: 2020,
    raisedGbp: 22_000_000,
    website: 'bcbattery.com',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Series A', amountGbp: 22_000_000, announced: '2026-08-06', investors: 'Legal & General · Midven' },
      { stage: 'Seed', amountGbp: 5_000_000, announced: '2023-07-19', investors: 'Midven · Innovate UK' },
    ],
    jobs: [
      { title: 'Cell Test Technician', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£34–41k', salaryFloor: 34000, postedAt: '2026-07-29' },
      { title: 'Grid Connections Manager', discipline: 'Ops', arrangement: 'Hybrid', salaryLabel: '£58–70k', salaryFloor: 58000, postedAt: '2026-08-10' },
      { title: 'Health & Safety Officer', discipline: 'Ops', arrangement: 'On-site', salaryLabel: '£40–47k', salaryFloor: 40000, postedAt: '2026-08-01' },
    ],
  },
  {
    slug: 'gridsense',
    name: 'GridSense',
    blurb: 'Substation monitoring from a Warwick spin-out',
    sectorId: 'cleantech',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 25,
    locality: 'Westwood Heath',
    postcode: 'CV4 8UW',
    authority: 'Coventry',
    lat: 52.38,
    lng: -1.561,
    founded: 2022,
    raisedGbp: 2_900_000,
    website: 'gridsense.co.uk',
    hiring: false,
    verified: true,
    claimed: true,
    rounds: [{ stage: 'Seed', amountGbp: 2_900_000, announced: '2025-03-27', investors: 'WMG · Mercia' }],
  },
  {
    slug: 'tame-valley-heat',
    name: 'Tame Valley Heat',
    blurb: 'Waste-heat recovery for foundries and bakeries',
    sectorId: 'cleantech',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 17,
    locality: 'Tamworth',
    postcode: 'B79 7NB',
    authority: 'Warwickshire',
    lat: 52.6339,
    lng: -1.6907,
    founded: 2023,
    raisedGbp: 2_100_000,
    website: 'tamevalleyheat.co.uk',
    hiring: true,
    verified: true,
    rounds: [{ stage: 'Seed', amountGbp: 2_100_000, announced: '2026-05-08', investors: 'MEIF · Innovate UK' }],
    jobs: [{ title: 'Process Engineer', discipline: 'Engineering', arrangement: 'On-site', salaryLabel: '£44–52k', salaryFloor: 44000, postedAt: '2026-08-02' }],
  },
  {
    slug: 'digbeth-loop-energy',
    name: 'Digbeth Loop Energy',
    blurb: 'Heat networks for canal-side redevelopment',
    sectorId: 'cleantech',
    stage: 'Series A',
    headcount: '51–200',
    headcountNum: 54,
    locality: 'Digbeth',
    postcode: 'B5 5SN',
    authority: 'Birmingham',
    lat: 52.4738,
    lng: -1.8871,
    founded: 2019,
    raisedGbp: 16_500_000,
    website: 'digbethloop.energy',
    hiring: true,
    verified: true,
    claimed: true,
    rounds: [
      { stage: 'Series A', amountGbp: 13_000_000, announced: '2026-06-11', investors: 'Legal & General · WMCA' },
      { stage: 'Seed', amountGbp: 3_500_000, announced: '2023-02-28', investors: 'Midven' },
    ],
    jobs: [
      { title: 'Energy Systems Modeller', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£52–63k', salaryFloor: 52000, postedAt: '2026-08-11' },
      { title: 'Planning Liaison Officer', discipline: 'Ops', arrangement: 'Hybrid', salaryLabel: '£38–45k', salaryFloor: 38000, postedAt: '2026-07-23' },
    ],
  },
  {
    slug: 'dudley-hydro',
    name: 'Dudley Hydro',
    blurb: 'Electrolyser stacks for industrial hydrogen',
    sectorId: 'cleantech',
    stage: 'Pre-seed',
    headcount: '1–10',
    headcountNum: 9,
    locality: 'Dudley',
    postcode: 'DY1 4SQ',
    authority: 'Black Country',
    lat: 52.512,
    lng: -2.081,
    founded: 2025,
    raisedGbp: 400_000,
    website: 'dudleyhydro.com',
    hiring: false,
    verified: false,
    rounds: [{ stage: 'Pre-seed', amountGbp: 400_000, announced: '2026-06-18', investors: 'Innovate UK · angels' }],
  },
  {
    slug: 'severn-circular',
    name: 'Severn Circular',
    blurb: 'Sorting robots for construction waste',
    sectorId: 'cleantech',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 20,
    locality: 'Coventry',
    postcode: 'CV6 5NY',
    authority: 'Coventry',
    lat: 52.4304,
    lng: -1.5011,
    founded: 2022,
    raisedGbp: 3_200_000,
    website: 'severncircular.com',
    hiring: true,
    verified: true,
    rounds: [{ stage: 'Seed', amountGbp: 3_200_000, announced: '2025-10-29', investors: 'Mercia · MEIF' }],
    jobs: [{ title: 'Robotics Software Engineer', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£54–66k', salaryFloor: 54000, postedAt: '2026-07-19' }],
  },

  {
    slug: 'digbeth-post',
    name: 'Digbeth Post',
    blurb: 'Virtual production stage and post house',
    about: 'A 24m LED volume and grading suites in a former locomotive works, five minutes from the BBC building.',
    sectorId: 'creative',
    stage: 'Bootstrapped',
    headcount: '11–50',
    headcountNum: 42,
    locality: 'Digbeth',
    postcode: 'B9 4AA',
    authority: 'Birmingham',
    lat: 52.4751,
    lng: -1.8826,
    founded: 2016,
    raisedGbp: 0,
    website: 'digbethpost.tv',
    hiring: false,
    verified: true,
    claimed: true,
  },
  {
    slug: 'solimark',
    name: 'Solimark',
    blurb: 'Brand measurement for retail media',
    sectorId: 'creative',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 30,
    locality: 'Solihull',
    postcode: 'B91 3QJ',
    authority: 'Solihull',
    lat: 52.413,
    lng: -1.778,
    founded: 2020,
    raisedGbp: 2_200_000,
    website: 'solimark.co',
    hiring: false,
    verified: true,
    claimed: true,
    rounds: [{ stage: 'Seed', amountGbp: 2_200_000, announced: '2024-05-16', investors: 'Praetura' }],
  },
  {
    slug: 'dudley-draft',
    name: 'Dudley Draft',
    blurb: 'Animation studio for broadcast and games',
    sectorId: 'creative',
    stage: 'Pre-seed',
    headcount: '1–10',
    headcountNum: 8,
    locality: 'Dudley',
    postcode: 'DY1 1LQ',
    authority: 'Black Country',
    lat: 52.5115,
    lng: -2.0785,
    founded: 2023,
    raisedGbp: 150_000,
    website: 'dudleydraft.tv',
    hiring: false,
    verified: false,
    rounds: [{ stage: 'Pre-seed', amountGbp: 150_000, announced: '2025-07-08', investors: 'Angels' }],
  },
  {
    slug: 'jq-atelier',
    name: 'JQ Atelier',
    blurb: 'Made-to-order jewellery configurator for independent workshops',
    sectorId: 'creative',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 16,
    locality: 'Jewellery Quarter',
    postcode: 'B18 6NF',
    authority: 'Birmingham',
    lat: 52.4885,
    lng: -1.9105,
    founded: 2021,
    raisedGbp: 1_600_000,
    website: 'jqatelier.com',
    hiring: true,
    verified: true,
    rounds: [{ stage: 'Seed', amountGbp: 1_600_000, announced: '2025-09-04', investors: 'MEIF · angels' }],
    jobs: [{ title: '3D Configurator Engineer', discipline: 'Engineering', arrangement: 'Hybrid', salaryLabel: '£46–56k', salaryFloor: 46000, postedAt: '2026-08-03' }],
  },
  {
    slug: 'custard-factory-audio',
    name: 'Custard Factory Audio',
    blurb: 'Spatial audio post for film and games',
    sectorId: 'creative',
    stage: 'Bootstrapped',
    headcount: '11–50',
    headcountNum: 14,
    locality: 'Digbeth',
    postcode: 'B9 4AA',
    authority: 'Birmingham',
    lat: 52.4762,
    lng: -1.8843,
    founded: 2018,
    raisedGbp: 0,
    website: 'cfaudio.co.uk',
    hiring: true,
    verified: true,
    jobs: [{ title: 'Dialogue Editor', discipline: 'Design', arrangement: 'On-site', salaryLabel: '£32–40k', salaryFloor: 32000, postedAt: '2026-07-14' }],
  },
  {
    slug: 'coventry-cathedral-xr',
    name: 'Cathedral XR',
    blurb: 'Heritage experiences for museums and cathedrals',
    sectorId: 'creative',
    stage: 'Seed',
    headcount: '11–50',
    headcountNum: 19,
    locality: 'Coventry',
    postcode: 'CV1 5AB',
    authority: 'Coventry',
    lat: 52.4085,
    lng: -1.5075,
    founded: 2019,
    raisedGbp: 2_800_000,
    website: 'cathedralxr.com',
    hiring: false,
    verified: true,
    claimed: true,
    rounds: [{ stage: 'Seed', amountGbp: 2_800_000, announced: '2024-10-02', investors: 'Arts Council · MEIF' }],
  },
  {
    slug: 'moseley-type',
    name: 'Moseley Type',
    blurb: 'Variable-font foundry and brand typography',
    sectorId: 'creative',
    stage: 'Bootstrapped',
    headcount: '1–10',
    headcountNum: 4,
    locality: 'Moseley',
    postcode: 'B13 8JP',
    authority: 'Birmingham',
    lat: 52.4451,
    lng: -1.8862,
    founded: 2020,
    raisedGbp: 0,
    website: 'moseleytype.com',
    verified: false,
  },
];

const EVENTS = [
  { title: 'Silicon Canal Meetup #48', venue: 'Impact Hub', locality: 'Digbeth', postcode: 'B9 4AA', lat: 52.4757, lng: -1.8838, startsAt: '2026-08-20T19:00:00Z' },
  { title: 'WM Investor Office Hours', venue: 'Innovation Birmingham', locality: 'Aston', postcode: 'B7 4BB', lat: 52.4899, lng: -1.8817, startsAt: '2026-08-25T09:30:00Z' },
  { title: 'Games Cluster Social', venue: 'The Assembly', locality: 'Leamington Spa', postcode: 'CV32 4RA', lat: 52.2896, lng: -1.5361, startsAt: '2026-09-04T18:00:00Z' },
  { title: 'Advanced Manufacturing Breakfast', venue: 'WMG, University of Warwick', locality: 'Coventry', postcode: 'CV4 7AL', lat: 52.3832, lng: -1.5615, startsAt: '2026-09-10T08:00:00Z' },
  { title: 'HealthTech in the NHS: what actually gets bought', venue: 'Birmingham Health Innovation Campus', locality: 'Edgbaston', postcode: 'B15 2SQ', lat: 52.4525, lng: -1.9345, startsAt: '2026-09-17T17:30:00Z' },
  { title: 'Black Country Founders Pint', venue: 'The Britannia', locality: 'Wolverhampton', postcode: 'WV1 3PW', lat: 52.5855, lng: -2.1268, startsAt: '2026-09-24T18:30:00Z' },
  { title: 'Silicon Canal Meetup #49', venue: 'Alpha Works', locality: 'Birmingham', postcode: 'B4 6AT', lat: 52.4823, lng: -1.8936, startsAt: '2026-10-15T19:00:00Z' },
  { title: 'Cleantech Demo Night', venue: 'Wolverhampton Science Park', locality: 'Wolverhampton', postcode: 'WV10 9RU', lat: 52.6002, lng: -2.1179, startsAt: '2026-10-22T18:00:00Z' },
];

/** Investor profiles. Anything named on a round but not listed here gets sensible defaults. */
const INVESTOR_META: Record<string, { kind: string; blurb: string; website?: string }> = {
  'Midven': { kind: 'Fund', blurb: 'Birmingham-based early-stage fund, manager of several regional vehicles. The name that appears most often on West Midlands cap tables.' },
  'MEIF': { kind: 'Fund', blurb: 'The Midlands Engine Investment Fund. Public-backed money aimed squarely at companies the London funds do not travel for.' },
  'BGF': { kind: 'Fund', blurb: 'Growth capital, minority stakes, patient by design. Turns up at Series A and later.' },
  'Praetura': { kind: 'Fund', blurb: 'Manchester-based, actively investing across the North and Midlands.' },
  'Ada Ventures': { kind: 'Fund', blurb: 'Early-stage fund with an explicit remit to back founders outside the usual networks.' },
  'Mercia': { kind: 'Fund', blurb: 'Midlands-headquartered investor working closely with regional universities.' },
  'Legal & General': { kind: 'Corporate', blurb: 'Institutional money into regional infrastructure and cleantech, usually at the larger end.' },
  'Innovate UK': { kind: 'Grant body', blurb: 'Grant funding, not equity. Often the first non-dilutive money a hardware company sees.' },
  'SFC Capital': { kind: 'Fund', blurb: 'High-volume pre-seed investor, frequently the first cheque.' },
  'WMG': { kind: 'University', blurb: 'The University of Warwick manufacturing group. Spins companies out and invests alongside them.' },
  'UoB Enterprise': { kind: 'University', blurb: 'University of Birmingham commercialisation arm.' },
  'Aston Uni Enterprise': { kind: 'University', blurb: 'Aston University spin-out and commercialisation arm.' },
  'Hiro Capital': { kind: 'Fund', blurb: 'Games and interactive-media specialist, a regular around Silicon Spa.' },
  'AlbionVC': { kind: 'Fund', blurb: 'B2B software and health investor, typically Series A.' },
  'Insurtech Gateway': { kind: 'Fund', blurb: 'Incubator and investor for insurance startups.' },
  'Black Country LEP': { kind: 'Grant body', blurb: 'Local enterprise money for Black Country manufacturers.' },
  'WMCA': { kind: 'Grant body', blurb: 'West Midlands Combined Authority, co-investing in regional infrastructure.' },
  'Arts Council': { kind: 'Grant body', blurb: 'Grant funding for cultural and creative technology.' },
  'Fair by Design': { kind: 'Fund', blurb: 'Fund targeting the premium low-income households pay for essential services.' },
  'Sunny Side': { kind: 'Fund', blurb: 'Small games-focused fund.' },
  'Dell Technologies Capital': { kind: 'Corporate', blurb: 'Corporate venture arm, infrastructure and deep tech.' },
};

const TAGS = [
  { slug: 'funding', label: 'Funding', blurb: 'Who raised what, from whom, and what it says about the region.' },
  { slug: 'hiring', label: 'Hiring', blurb: 'Where the roles are and what they pay.' },
  { slug: 'analysis', label: 'Analysis', blurb: 'Longer reads on how the West Midlands tech economy actually works.' },
  { slug: 'cleantech', label: 'Cleantech', blurb: 'Batteries, grid and heat across the region.' },
  { slug: 'games', label: 'Games', blurb: 'Silicon Spa and the studios around it.' },
  { slug: 'manufacturing', label: 'Manufacturing', blurb: 'Robotics, additive and shop-floor software.' },
  { slug: 'birmingham', label: 'Birmingham', blurb: 'Reporting from the city itself.' },
];

/** Opening editorial. Written in the house voice: numbers first, no hype, corrections welcome. */
const ARTICLES = [
  {
    slug: 'black-country-battery-raises-22m',
    title: 'Black Country Battery raises £22M to turn dead car packs into grid storage',
    excerpt:
      'The largest round on the map this year goes to a Wolverhampton company rebuilding end-of-life automotive cells into containerised storage.',
    kind: 'funding',
    companySlug: 'black-country-battery',
    tags: ['funding', 'cleantech'],
    publishedAt: '2026-08-07',
    body: `Black Country Battery has raised £22M in a Series A led by Legal & General, with Midven following on from the 2023 seed.

It is the largest single round recorded on this map in 2026, and it lands in Wolverhampton rather than Birmingham — which is worth pausing on, because it is not the exception it would have been five years ago.

## What the company does

Automotive battery packs are retired long before the cells inside them are finished. Black Country Battery takes those packs, grades the cells individually, and rebuilds the good ones into containerised storage for industrial sites that want to shave their peak demand charges.

The unglamorous part is the grading. Telling a cell with 80% of its capacity left from one with 55% is the entire business, and it is why the company has spent more on test rigs than on software.

## Why it matters here

The West Midlands built its economy on the internal combustion engine and has spent fifteen years being told that was a problem. This is the other side of that: a supply chain, a skills base and a set of industrial estates that happen to be exactly what you need if your product is heavy, electrical and needs certifying.

Three of the region's cleantech companies on this map are within twenty miles of a former automotive plant. That is not a coincidence and it is not sentiment — it is where the people who can do this work already live.

## What we do not know

The round was announced, so we have logged it. We do not know the valuation, we do not know how much of the £22M is equity versus debt, and we have not seen the customer list. If you know more and can source it, [tell us](/method#corrections).`,
  },
  {
    slug: 'silicon-spa-still-hiring',
    title: 'Silicon Spa is still hiring, quietly',
    excerpt:
      'Leamington\'s games cluster does not announce much. The job listings tell you more about its health than the press releases do.',
    kind: 'analysis',
    companySlug: 'leamlight',
    tags: ['games', 'hiring', 'analysis'],
    publishedAt: '2026-08-04',
    body: `There is a reason you rarely read about Leamington Spa in national tech coverage: the studios there mostly do co-development, and co-development is work you are contractually not allowed to talk about.

So the funding feed is thin. The jobs board is not.

## Read the roles, not the releases

Co-dev studios hire ahead of contracts they cannot name. When a Leamington studio posts three gameplay programmers in a month, someone has signed something. When they stop posting, the pipeline has thinned. It is a lagging indicator of press releases and a leading indicator of everything else.

## The cluster is real

Four studios on this map sit within a few miles of each other in Warwickshire, employing a few hundred people between them. That density matters more than any individual company: it means a mid-level artist can change jobs without changing house, which is the single thing that keeps a cluster from leaking talent to London or Montreal.

## The risk

Co-development is a margin business, and margin businesses are fragile when the publishers who pay them get nervous. The studios here that own original IP are the ones with a floor under them. There are fewer of those than there should be.`,
  },
  {
    slug: 'where-the-money-actually-goes',
    title: 'Where the money actually goes in the West Midlands',
    excerpt:
      'A third of the money raised here this year went to companies outside Birmingham. The map explains why, and where the gaps still are.',
    kind: 'analysis',
    tags: ['funding', 'analysis', 'birmingham'],
    publishedAt: '2026-07-28',
    body: `Every figure below is computed from the listings on this map, and you can check any of them by opening the company. Nothing here is an estimate.

## Birmingham is the centre, but not the whole thing

Roughly a third of announced round value this year went to companies whose registered office is outside Birmingham — Wolverhampton, Coventry, Warwickshire. That share has been trending up, and the reason is boring: the largest rounds are going to hardware and energy companies, and those companies need industrial floor space rather than a Colmore Row postcode.

## The investors are more regional than the founders expect

The names that recur on this map are Midven, MEIF, Mercia, BGF and the university arms. That is a genuinely local stack of capital, and it is the thing most founders here underestimate — they pitch London first out of habit, then discover the cheque that closes is from twenty miles away.

You can see the pattern on any [investor page](/investors): repeat backers, mostly at seed, mostly following on.

## Where the gap is

Series B. There is money to start here and money to grow to about £10M, and then a cliff. Companies that clear it tend to raise from outside the region, which is fine, right up until the point where it decides where the next office goes.

## Caveats

Undisclosed rounds count as zero. Plenty of money here moves quietly, so treat every total on this site as a floor rather than a number.`,
  },
  {
    slug: 'kanda-robotics-4-2m-seed',
    title: 'Kanda Robotics raises £4.2M to sell robots to firms with fifty staff',
    excerpt: 'A Tyseley company betting that the automation market is the SME shop floor, not the car plant.',
    kind: 'funding',
    companySlug: 'kanda-robotics',
    tags: ['funding', 'manufacturing'],
    publishedAt: '2026-07-13',
    body: `Kanda Robotics has raised £4.2M in a seed round led by Ada Ventures, with MEIF participating.

## The bet

Industrial robotics has historically sold to companies that can afford an integrator. Kanda sells a pick-and-place cell that a shop-floor supervisor can retask in an afternoon, aimed at firms with fifty staff rather than five thousand.

That is a much larger market and a much harder product, because the customer has no automation engineer and no appetite for a six-month deployment.

## Why Tyseley

Because that is where the customers are. The B11 industrial belt is full of exactly the kind of firm Kanda is selling to, which means the sales cycle can start with a visit rather than a webinar.

## What to watch

Field service. Selling robots to companies without engineers means you own the uptime problem, and the company is already hiring for it — a field service technician role has been open on the board for several weeks.`,
  },
  {
    slug: 'what-a-listing-gets-you',
    title: 'What being on this map actually gets you',
    excerpt: 'No SEO trick, no lead-gen funnel. Here is exactly what a listing does and what it does not.',
    kind: 'guide',
    tags: ['analysis'],
    publishedAt: '2026-07-20',
    body: `We get asked what the catch is. There isn't one, so here is the whole thing written down.

## What a listing does

- **You appear on the map and in the gallery**, filterable by sector, stage and place.
- **Your roles go on the regional jobs board**, free, with no agency reposts underneath them.
- **Your rounds get logged** with the investors named, and they show on the investor pages too.
- **You get found.** The sector and place pages exist to rank for the searches people actually type — "fintech startups birmingham" and its cousins.

## What it does not do

- It does not get you investment. No one is passing your listing to a fund.
- It does not verify your claims. We check the company exists and works here. We do not audit your revenue and would not publish it if we did.
- It does not cost anything, and there is no upgrade to sell you later.

## Why we are strict about corrections

Because the only asset here is that the data is right. If a listing is wrong, the whole map is a bit less useful. [Claim yours](/) and fix it, or [tell us](/method#corrections) and we will.`,
  },
  {
    slug: 'nhs-buyers-and-healthtech',
    title: 'Selling health tech to the NHS: what the founders here have learned',
    excerpt: 'Six health companies on this map sell into trusts. The pattern in how they got there is unusually consistent.',
    kind: 'roundup',
    tags: ['analysis', 'hiring'],
    publishedAt: '2026-07-10',
    body: `The West Midlands has one of the largest teaching hospital estates outside London, which is why most of the health companies on this map sell to trusts rather than consumers.

## The pattern

Almost all of them started with a single department, not a trust-wide deal. A pathology lab, a discharge team, one ward. The pilot is small enough to be signed by someone who has actually felt the problem, and large enough to produce a number you can take to the next trust.

## The hiring tell

Look at what these companies advertise for. Not sales — implementation. The bottleneck in NHS software is almost never the sale, it is the eighteen months afterwards where someone has to make it work alongside a system from 2009.

## The uncomfortable part

The sales cycle is long enough that it decides your funding strategy for you. Every company here that sells to trusts raised at least once purely to survive procurement, and the ones that did not plan for it had a bad year.`,
  },
];

const PERKS = [
  { title: 'AWS Activate — up to $25k credits', partner: 'AWS', blurb: 'Cloud credits and a solutions architect hour.', eligible: 'Verified pre-seed and seed listings', sortOrder: 1 },
  { title: '5 free hours with Shakespeare Martineau', partner: 'Shakespeare Martineau', blurb: 'Company formation, share schemes and IP.', eligible: 'Any verified listing, once', sortOrder: 2 },
  { title: 'Desk month at Alpha Works, free', partner: 'Alpha Works', blurb: 'One month of hot desks for up to four people.', eligible: 'Claim once per company', sortOrder: 3 },
  { title: 'Discounted WMG test rigs', partner: 'WMG, University of Warwick', blurb: '30% off battery and materials test time.', eligible: 'Advanced mfg and cleantech listings', sortOrder: 4 },
  { title: 'Free payroll for 12 months', partner: 'Dains', blurb: 'Payroll and pension admin up to 25 staff.', eligible: 'Verified listings under 25 people', sortOrder: 5 },
  { title: 'Two days in the Digbeth Post volume', partner: 'Digbeth Post', blurb: 'LED stage time for a product film.', eligible: 'Verified listings, applied for', sortOrder: 6 },
];

const SPACES = [
  { name: 'Alpha Works', locality: 'Birmingham', postcode: 'B4 6AT', deskNote: '12 desks', lat: 52.4823, lng: -1.8936 },
  { name: 'Impact Hub', locality: 'Digbeth', postcode: 'B9 4AA', deskNote: '4 desks', lat: 52.4757, lng: -1.8838 },
  { name: 'NatWest Accelerator', locality: 'Birmingham', postcode: 'B1 2HL', deskNote: 'Cohort open', lat: 52.4793, lng: -1.9121 },
  { name: 'Innovation Birmingham Campus', locality: 'Aston', postcode: 'B7 4BB', deskNote: '30 desks', lat: 52.4899, lng: -1.8817 },
  { name: 'The Hub at Leamington', locality: 'Leamington Spa', postcode: 'CV32 4RA', deskNote: '8 desks', lat: 52.2896, lng: -1.5361 },
  { name: 'i-Innovate, Coventry', locality: 'Coventry', postcode: 'CV1 2TT', deskNote: '15 desks', lat: 52.4062, lng: -1.5165 },
  { name: 'Wolverhampton Science Park', locality: 'Wolverhampton', postcode: 'WV10 9RU', deskNote: '22 desks', lat: 52.6002, lng: -2.1179 },
];

async function main() {
  // The companies below are invented. Seeding a production database with them
  // would put fake companies on a map whose entire pitch is that it is checked.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_FICTIONAL_SEED !== 'yes') {
    console.error(
      'Refusing to seed: this data is fictional and NODE_ENV is production.\n' +
        'Real listings come from the importers — see /admin/candidates.\n' +
        'Set ALLOW_FICTIONAL_SEED=yes only if you genuinely want placeholder data live.',
    );
    process.exit(1);
  }

  console.log('Clearing existing rows…');
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.roundInvestor.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.job.deleteMany();
  await prisma.round.deleteMany();
  await prisma.company.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.event.deleteMany();
  await prisma.perk.deleteMany();
  await prisma.space.deleteMany();

  await prisma.sector.createMany({ data: SECTORS });
  console.log(`Sectors: ${SECTORS.length}`);

  for (const c of COMPANIES) {
    const { rounds = [], jobs = [], ...company } = c;
    await prisma.company.create({
      data: {
        ...company,
        hiring: c.hiring ?? false,
        verified: c.verified ?? false,
        claimed: c.claimed ?? false,
        status: 'published',
        // Every seeded point is the real place, checked by hand. Marking them
        // located keeps the nightly backfill off them.
        geocodedAt: new Date(),
        rounds: {
          create: rounds.map((r) => ({
            stage: r.stage,
            amountGbp: r.amountGbp,
            announced: new Date(r.announced),
            investors: r.investors,
          })),
        },
        jobs: {
          create: jobs.map((j) => ({
            title: j.title,
            discipline: j.discipline,
            arrangement: j.arrangement,
            locality: c.locality,
            salaryLabel: j.salaryLabel,
            salaryFloor: j.salaryFloor,
            postedAt: new Date(j.postedAt),
          })),
        },
      },
    });
  }

  const jobCount = COMPANIES.reduce((n, c) => n + (c.jobs?.length ?? 0), 0);
  const roundCount = COMPANIES.reduce((n, c) => n + (c.rounds?.length ?? 0), 0);
  console.log(`Companies: ${COMPANIES.length} · rounds: ${roundCount} · roles: ${jobCount}`);

  await prisma.event.createMany({ data: EVENTS.map((e) => ({ ...e, startsAt: new Date(e.startsAt) })) });
  await prisma.perk.createMany({ data: PERKS });
  await prisma.space.createMany({ data: SPACES });
  console.log(`Events: ${EVENTS.length} · perks: ${PERKS.length} · spaces: ${SPACES.length}`);

  // --- Investors, normalised out of the round strings so they get their own pages ---
  const rounds = await prisma.round.findMany({ select: { id: true, investors: true } });
  const investorIds = new Map<string, string>();

  for (const round of rounds) {
    const names = round.investors
      .split('·')
      .map((n) => n.trim())
      .filter((n) => n && n.toLowerCase() !== 'angels');

    for (const name of names) {
      const slug = slugify(name);
      let id = investorIds.get(slug);
      if (!id) {
        const meta = INVESTOR_META[name] ?? { kind: 'Fund', blurb: '' };
        const created = await prisma.investor.create({
          data: { slug, name, kind: meta.kind, blurb: meta.blurb, website: meta.website ?? null },
          select: { id: true },
        });
        id = created.id;
        investorIds.set(slug, id);
      }
      await prisma.roundInvestor.create({ data: { roundId: round.id, investorId: id } });
    }
  }
  console.log(`Investors: ${investorIds.size}`);

  // --- Editorial ---
  const tagIds = new Map<string, string>();
  for (const t of TAGS) {
    const created = await prisma.tag.create({ data: t, select: { id: true } });
    tagIds.set(t.slug, created.id);
  }

  for (const a of ARTICLES) {
    const company = a.companySlug ? await prisma.company.findUnique({ where: { slug: a.companySlug }, select: { id: true } }) : null;
    await prisma.article.create({
      data: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        body: a.body,
        kind: a.kind,
        status: 'published',
        publishedAt: new Date(a.publishedAt),
        readMinutes: readingMinutes(a.body),
        companyId: company?.id ?? null,
        tags: { create: a.tags.map((slug) => ({ tagId: tagIds.get(slug)! })) },
      },
    });
  }
  console.log(`Tags: ${TAGS.length} · articles: ${ARTICLES.length}`);

  // A company that has been submitted but not yet verified — the review queue is never empty.
  await prisma.submission.deleteMany();
  await prisma.submission.create({
    data: {
      name: 'Bournville Bio',
      website: 'bournvillebio.com',
      contactName: 'A. Reeves',
      contactEmail: 'hello@bournvillebio.com',
      sectorId: 'cleantech',
      stage: 'Pre-seed',
      postcode: 'B30 1JR',
      blurb: 'Fermented cocoa-butter alternatives',
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
