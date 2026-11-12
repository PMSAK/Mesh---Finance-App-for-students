import type { ChargeRule, ReceiptItem, SplitMethod } from './types';
import { allocateProportional, splitEqual, sumValues } from './money';

export interface SplitInput {
  method: SplitMethod;
  totalMinor: number;
  /** Ordered participants. Order decides who receives rounding remainder paise. */
  participantIds: string[];
  /** unequal: memberId -> amount (minor) */
  amounts?: Record<string, number>;
  /** percentage: memberId -> basis points (50.00% = 5000) */
  basisPoints?: Record<string, number>;
  items?: ReceiptItem[];
  taxMinor?: number;
  tipMinor?: number;
  discountMinor?: number;
  chargeRule?: ChargeRule;
}

export interface SplitResult {
  ok: boolean;
  shares: Record<string, number>;
  errors: string[];
  /** Itemized only: calculated total (items + tax + tip − discount). */
  calculatedTotalMinor?: number;
  /** Total − allocated. Non-zero means user must correct something. */
  differenceMinor: number;
}

const fail = (errors: string[], total: number, shares: Record<string, number> = {}): SplitResult => ({
  ok: false,
  shares,
  errors,
  differenceMinor: total - sumValues(shares),
});

export function computeShares(input: SplitInput): SplitResult {
  const { method, totalMinor, participantIds } = input;
  const ids = [...new Set(participantIds)];
  if (!Number.isInteger(totalMinor) || totalMinor <= 0) return fail(['Enter an amount above zero.'], totalMinor);
  if (ids.length === 0) return fail(['Choose at least one person to split with.'], totalMinor);

  if (method === 'equal') {
    const parts = splitEqual(totalMinor, ids.length);
    return done(ids, parts, totalMinor);
  }

  if (method === 'unequal') {
    const amounts = input.amounts ?? {};
    const parts = ids.map((id) => amounts[id] ?? 0);
    if (parts.some((p) => !Number.isInteger(p) || p < 0)) return fail(['Amounts must be zero or more.'], totalMinor);
    const sum = parts.reduce((a, b) => a + b, 0);
    const shares = Object.fromEntries(ids.map((id, i) => [id, parts[i]]));
    if (sum !== totalMinor) return fail([`Shares add up to a different total (difference ${totalMinor - sum} paise).`], totalMinor, shares);
    return { ok: true, shares, errors: [], differenceMinor: 0 };
  }

  if (method === 'percentage') {
    const bp = input.basisPoints ?? {};
    const weights = ids.map((id) => bp[id] ?? 0);
    const sum = weights.reduce((a, b) => a + b, 0);
    if (weights.some((w) => !Number.isInteger(w) || w < 0)) return fail(['Percentages must be zero or more.'], totalMinor);
    if (sum !== 10000) return fail([`Percentages must add up to 100% (currently ${sum / 100}%).`], totalMinor);
    return done(ids, allocateProportional(totalMinor, weights), totalMinor);
  }

  return computeItemized(input, ids);
}

function done(ids: string[], parts: number[], total: number): SplitResult {
  const shares = Object.fromEntries(ids.map((id, i) => [id, parts[i]]));
  const diff = total - parts.reduce((a, b) => a + b, 0);
  return { ok: diff === 0, shares, errors: diff ? ['Shares do not reconcile.'] : [], differenceMinor: diff };
}

/**
 * Itemized: each item's cost is split equally among its assignees (remainder paise to the earlier
 * assignee). Tax + tip − discount are then allocated per `chargeRule`
 * (proportional to each person's item subtotal [default], or equal across people who have items).
 * The calculated total must equal the confirmed total — no price is silently altered.
 */
function computeItemized(input: SplitInput, ids: string[]): SplitResult {
  const items = input.items ?? [];
  const total = input.totalMinor;
  const errors: string[] = [];
  if (items.length === 0) return fail(['Add at least one item.'], total);

  const subtotals: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  for (const it of items) {
    if (!Number.isInteger(it.lineTotalMinor) || it.lineTotalMinor < 0) {
      errors.push(`"${it.name || 'Item'}" has an invalid price.`);
      continue;
    }
    const who = it.assignees.filter((a) => ids.includes(a));
    if (who.length === 0) {
      errors.push(`Assign "${it.name || 'an item'}" to at least one person.`);
      continue;
    }
    splitEqual(it.lineTotalMinor, who.length).forEach((p, k) => (subtotals[who[k]] += p));
  }
  const tax = input.taxMinor ?? 0;
  const tip = input.tipMinor ?? 0;
  const discount = input.discountMinor ?? 0;
  const itemsSum = items.reduce((a, b) => a + (Number.isInteger(b.lineTotalMinor) ? b.lineTotalMinor : 0), 0);
  const calculated = itemsSum + tax + tip - discount;
  if (errors.length) return { ...fail(errors, total, subtotals), calculatedTotalMinor: calculated };

  const charges = tax + tip - discount;
  const shares = { ...subtotals };
  if (charges !== 0) {
    const sign = charges < 0 ? -1 : 1;
    const eligible = ids.filter((id) => subtotals[id] > 0);
    const pool = eligible.length ? eligible : ids;
    const weights = input.chargeRule === 'equal' ? pool.map(() => 1) : pool.map((id) => subtotals[id]);
    allocateProportional(Math.abs(charges), weights).forEach((p, k) => (shares[pool[k]] += sign * p));
  }
  if (Object.values(shares).some((s) => s < 0)) {
    return { ...fail(['A discount is larger than one person\'s items. Review the discount.'], total, shares), calculatedTotalMinor: calculated };
  }
  const diff = total - sumValues(shares);
  if (diff !== 0) {
    return {
      ok: false,
      shares,
      calculatedTotalMinor: calculated,
      differenceMinor: diff,
      errors: ["These totals don't match yet. Review the item amounts before saving."],
    };
  }
  return { ok: true, shares, calculatedTotalMinor: calculated, errors: [], differenceMinor: 0 };
}
