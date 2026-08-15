import { marked } from 'marked';

/**
 * Article bodies are markdown, and the editor is trusted but not infinitely so.
 * Angle brackets are escaped *before* parsing, which means no raw HTML — and no
 * script tag — can survive into the output, whatever is typed. The only tags in
 * the result are the ones marked itself emits.
 */
function escapeHtml(raw: string): string {
  return raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(body: string): string {
  return marked.parse(escapeHtml(body), { async: false });
}

/** Roughly 220 words a minute, rounded up, never less than one. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** First paragraph, trimmed to a sentence or two — used when an excerpt is missing. */
export function autoExcerpt(body: string, max = 180): string {
  const firstBlock = body
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .find((s) => s && !s.startsWith('#') && !s.startsWith('!'));
  if (!firstBlock) return '';
  const flat = firstBlock.replace(/[#*_`>[\]()]/g, '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max).replace(/\s+\S*$/, '')}…` : flat;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}
