import type { AppState } from './types';
import { ME } from './types';
import { netPositions } from './ledger';
import { addDays, daysBetween } from './dates';
import type { RunwayInput } from './runway';

/**
 * Tracked cash is DERIVED, never stored, so edits/deletes can't double-count:
 *   opening − personal paid expenses − circle expenses I paid (the actual amount, not my share)
 *           − settlements I paid + settlements I received.
 * Money owed TO me (receivables) is never added; my unpaid shares (payables) are never subtracted
 * until I actually record a settlement payment.
 */
export function cashBalance(s: AppState): number {
  let cash = s.profile.openingBalanceMinor;
  for (const e of s.expenses) cash -= e.amountMinor;
  for (const e of s.circleExpenses) if (e.payerId === ME) cash -= e.totalMinor;
  for (const st of s.settlements) {
    if (st.status !== 'recorded') continue;
    if (st.fromId === ME) cash -= st.amountMinor;
    if (st.toId === ME) cash += st.amountMinor;
  }
  return cash;
}

export interface GroupPosition {
  /** Sum of positive circle nets: money friends owe me. NOT cash. */
  receivableMinor: number;
  /** Sum of negative circle nets: money I owe friends. Remains an obligation until settled. */
  payableMinor: number;
  byCircle: Record<string, number>;
}

export function groupPosition(s: AppState): GroupPosition {
  let receivable = 0;
  let payable = 0;
  const byCircle: Record<string, number> = {};
  for (const c of s.circles) {
    const net = netPositions(c, s.circleExpenses, s.settlements)[ME] ?? 0;
    byCircle[c.id] = net;
    if (net > 0) receivable += net;
    else payable += -net;
  }
  return { receivableMinor: receivable, payableMinor: payable, byCircle };
}

export const unpaidCommitmentsTotal = (s: AppState) =>
  s.commitments.filter((c) => c.status === 'unpaid').reduce((a, c) => a + c.amountMinor, 0);

export interface Spend {
  dailyMinor: number;
  source: 'measured' | 'estimate' | 'none';
}

/**
 * Measured average over the last 14 days from personal expenses + my share of Circle expenses.
 * Commitment payments (rent/fees) are excluded as one-offs. Needs >= 3 entries over >= 3 days,
 * otherwise falls back to the user's labelled estimate.
 */
export function trailingSpend(s: AppState, today: string, window = 14): Spend {
  const from = addDays(today, -(window - 1));
  const entries: { date: string; amt: number }[] = [];
  for (const e of s.expenses) if (!e.commitmentId && e.date >= from && e.date <= today) entries.push({ date: e.date, amt: e.amountMinor });
  for (const e of s.circleExpenses) {
    const share = e.shares[ME] ?? 0;
    if (share > 0 && e.date >= from && e.date <= today) entries.push({ date: e.date, amt: share });
  }
  if (entries.length >= 3) {
    const earliest = entries.reduce((a, b) => (b.date < a ? b.date : a), today);
    const span = daysBetween(earliest, today) + 1;
    if (span >= 3) {
      const total = entries.reduce((a, b) => a + b.amt, 0);
      return { dailyMinor: Math.floor(total / Math.min(window, span)), source: 'measured' };
    }
  }
  if (s.profile.estimatedDailySpendMinor > 0) return { dailyMinor: s.profile.estimatedDailySpendMinor, source: 'estimate' };
  return { dailyMinor: 0, source: 'none' };
}

export function runwayInputFor(s: AppState, today: string): RunwayInput & { spendSource: Spend['source'] } {
  const spend = trailingSpend(s, today);
  return {
    balanceMinor: cashBalance(s),
    commitmentsMinor: unpaidCommitmentsTotal(s),
    owedToFriendsMinor: groupPosition(s).payableMinor,
    bufferMinor: s.profile.safetyBufferMinor,
    mode: s.profile.incomeMode,
    nextIncomeDate: s.profile.nextIncomeDate,
    targetDays: s.profile.targetDays,
    trailingDailySpendMinor: spend.dailyMinor,
    today,
    spendSource: spend.source,
  };
}
