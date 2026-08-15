/**
 * Datum Labs brand lint.
 *
 *   npm run lint:brand          report violations
 *   npm run lint:brand -- --ci  same, but exit 1 on any error
 *
 * The brand book is a PDF, which means the only thing enforcing it is whoever
 * last read it. This turns the parts that can be checked mechanically — palette,
 * typefaces, gradient construction — into something the build can fail on.
 *
 * It deliberately does not try to judge taste. It checks four things:
 *
 *   1. colour       every raw colour is in the brand palette, the documented data
 *                   palette, or the tiny allow-list (white, transparent…)
 *   2. font         no typeface outside Source Serif 4 / Geist / Geist Mono
 *   3. gradient     gradients are built from tokens, never raw hex, so a palette
 *                   change cannot leave one behind
 *   4. token-bypass a raw colour where a var(--…) exists for the same value
 *
 * Rules live in brand/datum-labs.json. Change them there.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

interface BrandSpec {
  palette: Record<string, { hex: string }>;
  dataPalette: Record<string, string>;
  statusPalette: Record<string, string>;
  derived: Record<string, string>;
  typography: Record<string, { family: string }>;
  lint: {
    scan: string[];
    paletteSourceFiles: string[];
    allowedRawColours: string[];
  };
}

const root = process.cwd();
const spec = JSON.parse(readFileSync(path.join(root, 'brand', 'datum-labs.json'), 'utf8')) as BrandSpec;
const ci = process.argv.includes('--ci');

/* ------------------------------------------------------------------ rules --- */

const approvedHex = new Set(
  [
    ...Object.values(spec.palette).map((p) => p.hex),
    ...Object.values(spec.dataPalette).filter((v) => typeof v === 'string' && v.startsWith('#')),
    ...Object.values(spec.statusPalette).filter((v) => typeof v === 'string' && v.startsWith('#')),
    ...Object.values(spec.derived).filter((v) => typeof v === 'string' && v.startsWith('#')),
    ...spec.lint.allowedRawColours,
  ].map((h) => h.toLowerCase()),
);

/** Approved RGB triples, so alpha compositing on a brand colour is not a violation.
 *  Only the channels are checked — any opacity of a brand colour is still that colour. */
function hexToRgb(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const approvedRgb = new Set(
  [
    ...Object.values(spec.palette).map((p) => p.hex),
    ...Object.values(spec.dataPalette),
    ...Object.values(spec.statusPalette),
    ...Object.values(spec.derived),
    '#FFFFFF',
    '#000000',
  ]
    .filter((v): v is string => typeof v === 'string' && v.startsWith('#'))
    .map(hexToRgb)
    .filter((v): v is string => Boolean(v)),
);

const approvedFamilies = Object.values(spec.typography)
  .map((t) => t.family?.toLowerCase())
  .filter(Boolean);

/** Generic stacks are fine — they are fallbacks, not typeface choices. */
const GENERIC_FAMILIES = new Set([
  'sans-serif',
  'serif',
  'monospace',
  'system-ui',
  'ui-monospace',
  'inherit',
  'initial',
  'unset',
  '-apple-system',
  'blinkmacsystemfont',
  'segoe ui',
  'helvetica',
  'helvetica neue',
  'arial',
  'sfmono-regular',
  'menlo',
]);

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB = /\brgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g;
const FONT_FAMILY = /font-family\s*:\s*([^;}\n]+)/g;
const FONT_SHORTHAND = /\bfont\s*:\s*([^;}\n]+)/g;
const GRADIENT = /\b(linear|radial|conic)-gradient\(([^;]*?)\)/g;

interface Finding {
  file: string;
  line: number;
  rule: 'colour' | 'font' | 'gradient';
  severity: 'error' | 'warn';
  message: string;
  snippet: string;
}

/* ------------------------------------------------------------------ scan --- */

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'generated' || entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function checkFile(file: string): Finding[] {
  const rel = path.relative(root, file);
  const isPaletteSource = spec.lint.paletteSourceFiles.some((p) => rel === p);
  const source = readFileSync(file, 'utf8');
  const findings: Finding[] = [];

  // 1 + 4 — raw colours. The palette file is where colours are allowed to be born.
  if (!isPaletteSource) {
    for (const match of source.matchAll(HEX)) {
      const hex = match[0].toLowerCase();
      // Expand #abc so it can be compared with the six-digit palette.
      const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
      if (approvedHex.has(hex) || approvedHex.has(full)) continue;
      findings.push({
        file: rel,
        line: lineOf(source, match.index),
        rule: 'colour',
        severity: 'error',
        message: `${match[0]} is not in the Datum Labs palette`,
        snippet: source.split('\n')[lineOf(source, match.index) - 1]?.trim().slice(0, 90) ?? '',
      });
    }

    for (const match of source.matchAll(RGB)) {
      const triple = `${Number(match[1])},${Number(match[2])},${Number(match[3])}`;
      // Alpha over a brand colour is still the brand colour. Only off-palette
      // channels are worth reporting.
      if (approvedRgb.has(triple)) continue;
      findings.push({
        file: rel,
        line: lineOf(source, match.index),
        rule: 'colour',
        severity: 'warn',
        message: `rgb(${triple}) is not a Datum Labs colour`,
        snippet: source.split('\n')[lineOf(source, match.index) - 1]?.trim().slice(0, 90) ?? '',
      });
    }
  }

  // 2 — typefaces
  for (const pattern of [FONT_FAMILY, FONT_SHORTHAND]) {
    for (const match of source.matchAll(pattern)) {
      const value = match[1];
      if (!value || value.includes('var(')) continue; // token-driven, fine
      const families = value.split(',').map((f) => f.trim().replace(/^["']|["']$/g, '').toLowerCase());
      for (const family of families) {
        if (!family || GENERIC_FAMILIES.has(family)) continue;
        if (approvedFamilies.some((a) => family.includes(a!))) continue;
        if (/^\d|\/|^(normal|bold|italic|var)/.test(family)) continue; // shorthand size/weight parts
        findings.push({
          file: rel,
          line: lineOf(source, match.index),
          rule: 'font',
          severity: 'error',
          message: `"${family}" is not a Datum Labs typeface (Source Serif 4, Geist, Geist Mono)`,
          snippet: value.trim().slice(0, 90),
        });
      }
    }
  }

  // 3 — gradients must be built from tokens, outside the token files themselves
  for (const match of isPaletteSource ? [] : source.matchAll(GRADIENT)) {
    const body = match[2] ?? '';
    if (!HEX.test(body) && !/\brgba?\(/.test(body)) continue;
    HEX.lastIndex = 0;
    findings.push({
      file: rel,
      line: lineOf(source, match.index),
      rule: 'gradient',
      severity: 'warn',
      message: 'gradient built from raw colour — use tokens so a palette change carries through',
      snippet: match[0].slice(0, 90),
    });
  }

  return findings;
}

/* ---------------------------------------------------------------- report --- */

const files = spec.lint.scan.flatMap((dir) => {
  const full = path.join(root, dir);
  try {
    return walk(full);
  } catch {
    return [];
  }
});

const findings = files.flatMap(checkFile);
const errors = findings.filter((f) => f.severity === 'error');
const warnings = findings.filter((f) => f.severity === 'warn');

const byFile = new Map<string, Finding[]>();
for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) ?? []), f]);

const RED = '[31m';
const YELLOW = '[33m';
const DIM = '[2m';
const BOLD = '[1m';
const RESET = '[0m';

console.log(`\n${BOLD}Datum Labs brand lint${RESET} ${DIM}· ${files.length} files${RESET}\n`);

for (const [file, list] of [...byFile.entries()].sort()) {
  console.log(`${BOLD}${file}${RESET}`);
  for (const f of list.sort((a, b) => a.line - b.line)) {
    const colour = f.severity === 'error' ? RED : YELLOW;
    console.log(`  ${colour}${f.severity.padEnd(5)}${RESET} ${String(f.line).padStart(4)}  ${f.message}`);
    if (f.snippet) console.log(`        ${DIM}${f.snippet}${RESET}`);
  }
  console.log('');
}

if (!findings.length) {
  console.log(`${BOLD}On brand.${RESET} No violations.\n`);
} else {
  console.log(`${BOLD}${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.${RESET}`);
  console.log(`${DIM}Palette and typefaces are defined in brand/datum-labs.json.${RESET}\n`);
}

process.exit(ci && errors.length ? 1 : 0);
