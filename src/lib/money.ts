/** Integer minor-unit helpers. No floating-point arithmetic on money. */

const SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

/** Parse user text like "1,250.50" into minor units. Returns null if invalid. Max 2 decimals. */
export function parseAmountToMinor(input: string): number | null {
  const s = input.trim().replace(/,/g, '').replace(/^[₹$€£]/, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  const minor = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Minor units -> editable string without symbol ("1250.5" -> "1250.50" only when needed). */
export function minorToInput(minor: number): string {
  if (!minor) return '';
  const neg = minor < 0 ? '-' : '';
  const a = Math.abs(minor);
  const whole = Math.floor(a / 100);
  const frac = a % 100;
  return neg + whole + (frac ? '.' + String(frac).padStart(2, '0') : '');
}

/** "₹1,25,000" with Indian grouping; paise shown only when non-zero. */
export function formatMoney(minor: number, currency = 'INR'): string {
  const sym = SYMBOLS[currency] ?? currency + ' ';
  const neg = minor < 0;
  const a = Math.abs(Math.round(minor));
  const whole = Math.floor(a / 100);
  const frac = a % 100;
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const w = whole.toLocaleString(locale);
  return (neg ? '-' : '') + sym + w + (frac ? '.' + String(frac).padStart(2, '0') : '');
}

/**
 * Split `total` equally across n parts. The remainder (in paise) is given one unit each to the
 * FIRST parts, in the order supplied. Always sums exactly to total.
 */
export function splitEqual(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

/**
 * Largest-remainder allocation of `total` proportionally to non-negative integer `weights`.
 * Ties on the fractional remainder go to the earlier index. Sums exactly to total.
 * If all weights are zero, falls back to an equal split.
 */
export function allocateProportional(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return splitEqual(total, n);
  const base = weights.map((w) => Math.floor((total * w) / sum));
  const fracRank = weights.map((w, i) => ({ i, r: (total * w) % sum }));
  let rem = total - base.reduce((a, b) => a + b, 0);
  fracRank.sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; rem > 0; k = (k + 1) % n, rem--) base[fracRank[k].i] += 1;
  return base;
}

export const sumValues = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
