/**
 * Number and date formatting, in the house style.
 * £ always, no decimals unless they are material, en dashes for ranges,
 * and dates written the way they are said out loud: "Thu 20 Aug".
 */

export function monogram(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** 0 → "—" (bootstrapped or undisclosed; we do not pretend to know). */
export function money(gbp: number): string {
  if (!gbp) return '—';
  if (gbp >= 1_000_000) {
    const m = gbp / 1_000_000;
    return `£${m >= 10 ? Math.round(m) : Number(m.toFixed(1))}M`;
  }
  if (gbp >= 1_000) return `£${Math.round(gbp / 1_000)}k`;
  return `£${gbp.toLocaleString('en-GB')}`;
}

export function count(n: number): string {
  return n.toLocaleString('en-GB');
}

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "06 Aug" */
export function shortDate(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTH[d.getUTCMonth()]}`;
}

/** "10 Aug 2026" */
export function fullDate(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Thu 20 Aug" */
export function eventDate(d: Date): string {
  return `${DAY[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, '0')} ${MONTH[d.getUTCMonth()]}`;
}

/** "19:00" */
export function eventTime(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/** "3 days ago". Rounds down, and never claims more precision than a day. */
export function sinceLabel(d: Date, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

/** "1 role" / "4 roles" — the copy leads with the figure, so the noun follows it. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${count(n)} ${n === 1 ? one : many}`;
}
