import type { Circle, CircleExpense, Settlement } from './types';

/**
 * The Vibe Ledger is DERIVED from confirmed expenses + recorded settlements — there are no manually
 * mutated debt totals. Sign convention: pair(a,b) > 0 means b owes a.
 * Net position of a member = Credits − Debits: positive = is owed money, negative = owes money.
 */
export type PairMatrix = Record<string, Record<string, number>>;

export function buildPairs(circle: Circle, expenses: CircleExpense[], settlements: Settlement[]): PairMatrix {
  const m: PairMatrix = {};
  for (const mem of circle.members) m[mem.id] = {};
  const add = (a: string, b: string, x: number) => {
    if (a === b || !m[a] || !m[b]) return;
    m[a][b] = (m[a][b] ?? 0) + x;
    m[b][a] = (m[b][a] ?? 0) - x;
  };
  for (const e of expenses) {
    if (e.circleId !== circle.id) continue;
    for (const [id, share] of Object.entries(e.shares)) add(e.payerId, id, share);
  }
  for (const s of settlements) {
    if (s.circleId !== circle.id || s.status !== 'recorded') continue;
    add(s.toId, s.fromId, -s.amountMinor); // payer now owes recipient less
  }
  return m;
}

export function netPositions(circle: Circle, expenses: CircleExpense[], settlements: Settlement[]): Record<string, number> {
  const pairs = buildPairs(circle, expenses, settlements);
  return Object.fromEntries(
    circle.members.map((mem) => [mem.id, Object.values(pairs[mem.id] ?? {}).reduce((a, b) => a + b, 0)]),
  );
}

export interface Transfer {
  fromId: string;
  toId: string;
  amountMinor: number;
}

/**
 * Deterministic greedy net settlement. Debtors and creditors are sorted by amount (desc) then id;
 * each step transfers min(debt, credit). Net positions always sum to zero, so nothing is left over.
 * These are SUGGESTIONS only — nothing is paid until a settlement is recorded.
 */
export function suggestSettlements(nets: Record<string, number>): Transfer[] {
  const debtors = Object.entries(nets).filter(([, v]) => v < 0).map(([id, v]) => ({ id, amt: -v }));
  const creditors = Object.entries(nets).filter(([, v]) => v > 0).map(([id, v]) => ({ id, amt: v }));
  const order = (a: { id: string; amt: number }, b: { id: string; amt: number }) => b.amt - a.amt || a.id.localeCompare(b.id);
  debtors.sort(order);
  creditors.sort(order);
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const x = Math.min(debtors[i].amt, creditors[j].amt);
    if (x > 0) out.push({ fromId: debtors[i].id, toId: creditors[j].id, amountMinor: x });
    debtors[i].amt -= x;
    creditors[j].amt -= x;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }
  return out;
}

export type VibeStatus = 'clear' | 'buffered' | 'ready';
/** Presentation only: never changes balances. */
export function vibeStatus(amountMinor: number, thresholdMinor: number): VibeStatus {
  const a = Math.abs(amountMinor);
  if (a === 0) return 'clear';
  return a >= thresholdMinor ? 'ready' : 'buffered';
}

/** Everything contributing to what `other` owes `me` (positive) in this circle, newest first. */
export function pairHistory(
  circle: Circle,
  expenses: CircleExpense[],
  settlements: Settlement[],
  meId: string,
  otherId: string,
) {
  const rows: { kind: 'expense' | 'settlement'; id: string; date: string; title: string; deltaMinor: number }[] = [];
  for (const e of expenses) {
    if (e.circleId !== circle.id) continue;
    if (e.payerId === meId && e.shares[otherId]) rows.push({ kind: 'expense', id: e.id, date: e.date, title: e.title, deltaMinor: e.shares[otherId] });
    else if (e.payerId === otherId && e.shares[meId]) rows.push({ kind: 'expense', id: e.id, date: e.date, title: e.title, deltaMinor: -e.shares[meId] });
  }
  for (const s of settlements) {
    if (s.circleId !== circle.id || s.status !== 'recorded') continue;
    if (s.fromId === otherId && s.toId === meId) rows.push({ kind: 'settlement', id: s.id, date: s.confirmedAt.slice(0, 10), title: 'Settlement recorded', deltaMinor: -s.amountMinor });
    else if (s.fromId === meId && s.toId === otherId) rows.push({ kind: 'settlement', id: s.id, date: s.confirmedAt.slice(0, 10), title: 'Settlement recorded', deltaMinor: s.amountMinor });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}
