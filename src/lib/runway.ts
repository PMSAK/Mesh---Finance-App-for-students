import type { IncomeMode } from './types';
import { daysBetween, isValidDate } from './dates';

export interface RunwayInput {
  balanceMinor: number;
  /** Unpaid upcoming commitments (eligible, i.e. status 'unpaid'). */
  commitmentsMinor: number;
  /** Net amount the user owes friends in Circles (payables). Receivables are NEVER included. */
  owedToFriendsMinor: number;
  bufferMinor: number;
  mode: IncomeMode;
  nextIncomeDate: string | null;
  targetDays: number | null;
  /** Average daily spend (measured or user estimate). 0 = unavailable. */
  trailingDailySpendMinor: number;
  today: string;
}

export type RunwayStatus = 'comfortable' | 'caution' | 'at_risk';

export interface RunwayResult {
  flexibleMinor: number;
  reservedMinor: number; // commitments + owed to friends
  daysRemaining: number | null; // ExactDate / TargetDays horizon
  dailyLimitMinor: number | null; // floored to whole paise
  estimatedDaysLeft: number | null; // Unknown mode
  status: RunwayStatus;
  /** Visible reasons behind the status (heuristics, labelled as such in the UI). */
  reasons: string[];
  error: string | null;
  staleDate: boolean;
  explanation: string;
}

/**
 * Status heuristics (simple, documented, NOT validated forecasts):
 *  - at_risk:  cash can't cover reserved obligations, the income date is stale, or (Unknown mode) < 3 days left.
 *  - caution:  spending would dip into the safety buffer, daily limit is below recent average spend,
 *              or (Unknown mode) fewer than 7 days of runway.
 *  - comfortable: otherwise.
 */
export function computeRunway(i: RunwayInput): RunwayResult {
  const reserved = i.commitmentsMinor + i.owedToFriendsMinor;
  const flexible = Math.max(0, i.balanceMinor - reserved - i.bufferMinor);
  const reasons: string[] = [];
  let error: string | null = null;
  let stale = false;
  let days: number | null = null;
  let daily: number | null = null;
  let est: number | null = null;

  if (i.mode === 'ExactDate') {
    if (!isValidDate(i.nextIncomeDate)) {
      error = 'Add a valid allowance date to see a daily limit.';
    } else {
      const diff = daysBetween(i.today, i.nextIncomeDate);
      if (diff < 0) {
        stale = true;
        error = 'Your allowance date has passed. Update it to get an accurate limit.';
      } else {
        days = Math.max(1, diff); // income today => one planning day
        daily = Math.floor(flexible / days);
      }
    }
  } else if (i.mode === 'TargetDays') {
    if (!Number.isInteger(i.targetDays) || (i.targetDays ?? 0) <= 0) {
      error = 'Planning days must be a whole number above zero.';
    } else {
      days = i.targetDays as number;
      daily = Math.floor(flexible / days);
    }
  } else {
    if (i.trailingDailySpendMinor > 0) {
      est = Math.floor((flexible / i.trailingDailySpendMinor) * 10) / 10;
    } else {
      error = 'We need some spending data to estimate your runway. Add expenses or an estimate, or pick a planning period.';
    }
  }

  const cover = i.balanceMinor - reserved;
  let status: RunwayStatus = 'comfortable';
  if (cover < 0) {
    status = 'at_risk';
    reasons.push('Cash is lower than what is already reserved.');
  } else if (stale) {
    status = 'at_risk';
    reasons.push('The allowance date has passed.');
  } else if (cover - i.bufferMinor < 0) {
    status = 'caution';
    reasons.push('Cash after reserved money is below your safety buffer.');
  }
  if (daily !== null && i.trailingDailySpendMinor > 0 && daily < i.trailingDailySpendMinor && status === 'comfortable') {
    status = 'caution';
    reasons.push('Your limit is below your recent average daily spend.');
  }
  if (est !== null) {
    if (est < 3 && status !== 'at_risk') {
      status = 'at_risk';
      reasons.push('Less than 3 days of runway at your recent spending.');
    } else if (est < 7 && status === 'comfortable') {
      status = 'caution';
      reasons.push('Less than a week of runway at your recent spending.');
    }
  }
  if (flexible === 0 && status === 'comfortable') {
    status = 'caution';
    reasons.push('Nothing is left to spend after reserved money and buffer.');
  }

  let explanation = '';
  if (daily !== null && days !== null) {
    explanation = `(cash − reserved − buffer) ÷ ${days} day${days === 1 ? '' : 's'}, rounded down.`;
  } else if (est !== null) {
    explanation = 'Flexible balance ÷ your average daily spend. An estimate, not a promise.';
  } else {
    explanation = error ?? '';
  }

  return {
    flexibleMinor: flexible,
    reservedMinor: reserved,
    daysRemaining: days,
    dailyLimitMinor: daily,
    estimatedDaysLeft: est,
    status,
    reasons,
    error,
    staleDate: stale,
    explanation,
  };
}

export interface AffordResult {
  before: RunwayResult;
  after: RunwayResult;
  flexibleAfterMinor: number;
  coversCommitments: boolean;
  belowBuffer: boolean;
  verdict: 'ok' | 'dips_buffer' | 'breaks_commitments';
}

/** Preview only: assumes the purchase is paid from tracked cash. Does not touch recorded balances. */
export function previewPurchase(i: RunwayInput, amountMinor: number): AffordResult {
  const before = computeRunway(i);
  const after = computeRunway({ ...i, balanceMinor: i.balanceMinor - amountMinor });
  const reserved = i.commitmentsMinor + i.owedToFriendsMinor;
  const coversCommitments = i.balanceMinor - amountMinor >= reserved;
  const belowBuffer = i.balanceMinor - amountMinor - reserved < i.bufferMinor;
  return {
    before,
    after,
    flexibleAfterMinor: after.flexibleMinor,
    coversCommitments,
    belowBuffer,
    verdict: !coversCommitments ? 'breaks_commitments' : belowBuffer ? 'dips_buffer' : 'ok',
  };
}
