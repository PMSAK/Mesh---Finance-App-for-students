/** Local-calendar date helpers using 'YYYY-MM-DD' strings (never raw hour differences). */

export function todayStr(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isValidDate(s: string | null | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const toUTC = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Whole calendar days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUTC(b) - toUTC(a)) / 86400000);
}

export function addDays(s: string, n: number): string {
  const dt = new Date(toUTC(s) + n * 86400000);
  return dt.toISOString().slice(0, 10);
}

export function addMonths(s: string, n: number): string {
  const [y, m, d] = s.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

export function formatDate(s: string, today = todayStr()): string {
  if (!isValidDate(s)) return s;
  const diff = daysBetween(today, s);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(y !== Number(today.slice(0, 4)) ? { year: 'numeric' } : {}),
  });
}

export function relativeTime(iso: string, now = new Date()): string {
  const t = new Date(iso);
  const mins = Math.round((now.getTime() - t.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(todayStr(t), todayStr(now));
}
