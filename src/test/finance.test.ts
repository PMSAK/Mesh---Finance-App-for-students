import { describe, expect, it } from 'vitest';
import { allocateProportional, formatMoney, parseAmountToMinor, splitEqual } from '../lib/money';
import { computeRunway, previewPurchase, type RunwayInput } from '../lib/runway';
import { computeShares } from '../lib/split';
import { buildPairs, netPositions, suggestSettlements, vibeStatus } from '../lib/ledger';
import { cashBalance, groupPosition, runwayInputFor, trailingSpend } from '../lib/accounting';
import * as A from '../lib/actions';
import { demoState } from '../lib/demo';
import { validateReceipt, parseModelJson } from '../lib/receipt';
import { ME, type AppState, type ReceiptItem } from '../lib/types';

const T = '2026-10-24';
const base: RunwayInput = {
  balanceMinor: 1000000, commitmentsMinor: 0, owedToFriendsMinor: 0, bufferMinor: 0,
  mode: 'ExactDate', nextIncomeDate: '2026-11-03', targetDays: null, trailingDailySpendMinor: 0, today: T,
};

describe('money', () => {
  it('parses and formats INR', () => {
    expect(parseAmountToMinor('1,250.5')).toBe(125050);
    expect(parseAmountToMinor('12.345')).toBeNull();
    expect(parseAmountToMinor('abc')).toBeNull();
    expect(formatMoney(12500000)).toBe('₹1,25,000');
    expect(formatMoney(12550)).toBe('₹125.50');
  });
  it('splits with remainder to first parts and always sums exactly', () => {
    expect(splitEqual(10000, 3)).toEqual([3334, 3333, 3333]);
    expect(allocateProportional(1000, [1, 1, 1]).reduce((a, b) => a + b)).toBe(1000);
    expect(allocateProportional(101, [3, 1])).toEqual([76, 25]);
  });
});

describe('runway', () => {
  it('exact date: (B-C-R)/days', () => {
    const r = computeRunway({ ...base, commitmentsMinor: 200000, bufferMinor: 100000 });
    expect(r.daysRemaining).toBe(10);
    expect(r.flexibleMinor).toBe(700000);
    expect(r.dailyLimitMinor).toBe(70000);
  });
  it('target days', () => {
    const r = computeRunway({ ...base, mode: 'TargetDays', targetDays: 4 });
    expect(r.dailyLimitMinor).toBe(250000);
  });
  it('rejects zero/negative/non-integer target days', () => {
    for (const d of [0, -3, 2.5, null]) {
      const r = computeRunway({ ...base, mode: 'TargetDays', targetDays: d });
      expect(r.dailyLimitMinor).toBeNull();
      expect(r.error).toBeTruthy();
    }
  });
  it('unknown: estimates days from trailing spend, never fabricates a limit', () => {
    const r = computeRunway({ ...base, mode: 'Unknown', trailingDailySpendMinor: 50000 });
    expect(r.estimatedDaysLeft).toBe(20);
    expect(r.dailyLimitMinor).toBeNull();
    const none = computeRunway({ ...base, mode: 'Unknown' });
    expect(none.estimatedDaysLeft).toBeNull();
    expect(none.error).toBeTruthy();
  });
  it('income today counts as one day; past date is flagged stale', () => {
    expect(computeRunway({ ...base, nextIncomeDate: T }).daysRemaining).toBe(1);
    const past = computeRunway({ ...base, nextIncomeDate: '2026-10-20' });
    expect(past.staleDate).toBe(true);
    expect(past.dailyLimitMinor).toBeNull();
    expect(past.status).toBe('at_risk');
  });
  it('invalid date is handled', () => {
    expect(computeRunway({ ...base, nextIncomeDate: '2026-02-31' }).error).toBeTruthy();
    expect(computeRunway({ ...base, nextIncomeDate: null }).error).toBeTruthy();
  });
  it('zero balance, commitments > cash, buffer > cash never go negative', () => {
    expect(computeRunway({ ...base, balanceMinor: 0 }).dailyLimitMinor).toBe(0);
    const r = computeRunway({ ...base, balanceMinor: 100000, commitmentsMinor: 500000 });
    expect(r.flexibleMinor).toBe(0);
    expect(r.status).toBe('at_risk');
    expect(computeRunway({ ...base, balanceMinor: 100000, bufferMinor: 900000 }).flexibleMinor).toBe(0);
    expect(computeRunway({ ...base, balanceMinor: -5000 }).flexibleMinor).toBe(0);
  });
  it('owed-to-friends reduces flexible; receivables are not an input at all', () => {
    expect(computeRunway({ ...base, owedToFriendsMinor: 100000 }).flexibleMinor).toBe(900000);
  });
  it('purchase preview does not mutate and reports verdicts', () => {
    const inp = { ...base, commitmentsMinor: 400000, bufferMinor: 100000 };
    expect(previewPurchase(inp, 100000).verdict).toBe('ok');
    expect(previewPurchase(inp, 550000).verdict).toBe('dips_buffer');
    expect(previewPurchase(inp, 700000).verdict).toBe('breaks_commitments');
    expect(inp.balanceMinor).toBe(1000000);
  });
});

describe('splits', () => {
  const ids = ['a', 'b', 'c'];
  it('equal split reconciles', () => {
    const r = computeShares({ method: 'equal', totalMinor: 60000, participantIds: ids });
    expect(r.shares).toEqual({ a: 20000, b: 20000, c: 20000 });
    const odd = computeShares({ method: 'equal', totalMinor: 10000, participantIds: ids });
    expect(Object.values(odd.shares).reduce((x, y) => x + y)).toBe(10000);
  });
  it('single participant', () => {
    expect(computeShares({ method: 'equal', totalMinor: 5000, participantIds: ['a'] }).shares).toEqual({ a: 5000 });
  });
  it('unequal must sum exactly', () => {
    expect(computeShares({ method: 'unequal', totalMinor: 10000, participantIds: ['a', 'b'], amounts: { a: 7000, b: 2000 } }).ok).toBe(false);
    expect(computeShares({ method: 'unequal', totalMinor: 10000, participantIds: ['a', 'b'], amounts: { a: 7000, b: 3000 } }).ok).toBe(true);
  });
  it('percentage must be 100% and reconcile', () => {
    expect(computeShares({ method: 'percentage', totalMinor: 10000, participantIds: ['a', 'b'], basisPoints: { a: 5000, b: 4000 } }).ok).toBe(false);
    const r = computeShares({ method: 'percentage', totalMinor: 10001, participantIds: ['a', 'b', 'c'], basisPoints: { a: 3333, b: 3333, c: 3334 } });
    expect(r.ok).toBe(true);
    expect(Object.values(r.shares).reduce((x, y) => x + y)).toBe(10001);
  });
  const mkItems = (): ReceiptItem[] => [
    { id: '1', name: 'Sandwich', quantity: 2, unitPriceMinor: 12000, lineTotalMinor: 24000, assignees: ['a'] },
    { id: '2', name: 'Coffee', quantity: 1, unitPriceMinor: 8000, lineTotalMinor: 8000, assignees: ['b'] },
  ];
  it('itemized: tax allocated proportionally and total reconciles (spec example 336)', () => {
    const r = computeShares({ method: 'itemized', totalMinor: 33600, participantIds: ['a', 'b'], items: mkItems(), taxMinor: 1600 });
    expect(r.ok).toBe(true);
    expect(r.shares).toEqual({ a: 25200, b: 8400 });
  });
  it('itemized: equal charge rule + shared item + tip', () => {
    const items = mkItems();
    items[1].assignees = ['a', 'b'];
    const r = computeShares({ method: 'itemized', totalMinor: 34000, participantIds: ['a', 'b'], items, tipMinor: 2000, chargeRule: 'equal' });
    expect(r.ok).toBe(true);
    expect(r.shares).toEqual({ a: 24000 + 4000 + 1000, b: 4000 + 1000 });
  });
  it('itemized: mismatch is reported, never silently fixed; unassigned item rejected', () => {
    const r = computeShares({ method: 'itemized', totalMinor: 40000, participantIds: ['a', 'b'], items: mkItems() });
    expect(r.ok).toBe(false);
    expect(r.differenceMinor).toBe(8000);
    const items = mkItems();
    items[0].assignees = [];
    expect(computeShares({ method: 'itemized', totalMinor: 32000, participantIds: ['a', 'b'], items }).ok).toBe(false);
  });
  it('itemized shares always sum to total with rounding remainders', () => {
    const items: ReceiptItem[] = [{ id: '1', name: 'Pizza', quantity: 1, unitPriceMinor: 10001, lineTotalMinor: 10001, assignees: ['a', 'b', 'c'] }];
    const r = computeShares({ method: 'itemized', totalMinor: 10001 + 501, participantIds: ids, items, taxMinor: 501 });
    expect(r.ok).toBe(true);
    expect(Object.values(r.shares).reduce((x, y) => x + y)).toBe(10502);
  });
});

/* ------------------------- accounting through actions ------------------------- */
function setup(): AppState {
  let s = A.initialState();
  s = A.completeOnboarding(s, { ...s.profile, name: 'Riya', openingBalanceMinor: 1000000, incomeMode: 'ExactDate', nextIncomeDate: '2026-11-03', safetyBufferMinor: 100000 }, []);
  s = A.createCircle(s, { id: 'c1', name: 'Trip', emoji: '🌴', description: '', memberNames: ['Aarav', 'Meera'], vibeThresholdMinor: 5000, settlementPref: 'manual' });
  return s;
}
const mem = (s: AppState, n: string) => s.circles[0].members.find((m) => m.name === n)!.id;
function groupExp(s: AppState, id: string, payer: string, total: number, ids: string[]) {
  const r = computeShares({ method: 'equal', totalMinor: total, participantIds: ids });
  return A.saveCircleExpense(s, { id, circleId: 'c1', title: id, payerId: payer, totalMinor: total, date: T, method: 'equal', shares: r.shares, notes: '' }, 'create');
}

describe('accounting', () => {
  it('payer cash falls by the full amount paid; receivable is not cash', () => {
    let s = setup();
    const all = s.circles[0].members.map((m) => m.id);
    s = groupExp(s, 'e1', ME, 60000, all);
    expect(cashBalance(s)).toBe(1000000 - 60000);
    const g = groupPosition(s);
    expect(g.receivableMinor).toBe(40000);
    expect(g.payableMinor).toBe(0);
    expect(runwayInputFor(s, T).balanceMinor).toBe(940000); // not 980000
  });
  it('friend pays: my cash unchanged, my share is an obligation that reduces runway', () => {
    let s = setup();
    const aarav = mem(s, 'Aarav');
    s = groupExp(s, 'e1', aarav, 60000, s.circles[0].members.map((m) => m.id));
    expect(cashBalance(s)).toBe(1000000);
    expect(groupPosition(s).payableMinor).toBe(20000);
    const before = A.initialState();
    void before;
    expect(runwayInputFor(s, T).owedToFriendsMinor).toBe(20000);
    expect(computeRunway(runwayInputFor(s, T)).flexibleMinor).toBe(1000000 - 20000 - 100000);
  });
  it('settlement: paying a friend lowers cash and the obligation exactly once; no new expense', () => {
    let s = setup();
    const aarav = mem(s, 'Aarav');
    s = groupExp(s, 'e1', aarav, 60000, s.circles[0].members.map((m) => m.id));
    const nExp = s.circleExpenses.length;
    s = A.recordSettlement(s, { id: 's1', circleId: 'c1', fromId: ME, toId: aarav, amountMinor: 20000 });
    expect(cashBalance(s)).toBe(980000);
    expect(groupPosition(s).payableMinor).toBe(0);
    expect(s.circleExpenses.length).toBe(nExp);
    // resubmitting same settlement id is idempotent
    expect(cashBalance(A.recordSettlement(s, { id: 's1', circleId: 'c1', fromId: ME, toId: aarav, amountMinor: 20000 }))).toBe(980000);
  });
  it('receiving a settlement increases cash; partial settlement leaves remainder; cancel restores', () => {
    let s = setup();
    const aarav = mem(s, 'Aarav');
    s = groupExp(s, 'e1', ME, 60000, s.circles[0].members.map((m) => m.id));
    s = A.recordSettlement(s, { id: 's1', circleId: 'c1', fromId: aarav, toId: ME, amountMinor: 5000 });
    expect(cashBalance(s)).toBe(940000 + 5000);
    expect(groupPosition(s).receivableMinor).toBe(35000);
    s = A.cancelSettlement(s, 's1');
    expect(cashBalance(s)).toBe(940000);
    expect(groupPosition(s).receivableMinor).toBe(40000);
  });
  it('editing a group expense recalculates from the ledger (no double count)', () => {
    let s = setup();
    const all = s.circles[0].members.map((m) => m.id);
    s = groupExp(s, 'e1', ME, 60000, all);
    const r = computeShares({ method: 'equal', totalMinor: 90000, participantIds: all });
    s = A.saveCircleExpense(s, { ...s.circleExpenses[0], totalMinor: 90000, shares: r.shares }, 'edit');
    expect(cashBalance(s)).toBe(1000000 - 90000);
    expect(groupPosition(s).receivableMinor).toBe(60000);
    s = A.deleteCircleExpense(s, 'e1');
    expect(cashBalance(s)).toBe(1000000);
    expect(groupPosition(s).receivableMinor).toBe(0);
  });
  it('duplicate submission of the same expense is ignored', () => {
    let s = setup();
    const all = s.circles[0].members.map((m) => m.id);
    s = groupExp(s, 'e1', ME, 60000, all);
    s = groupExp(s, 'e1', ME, 60000, all);
    expect(s.circleExpenses.length).toBe(1);
    expect(cashBalance(s)).toBe(940000);
  });
  it('payer not a participant: payer owed the full amount', () => {
    let s = setup();
    const [aarav, meera] = [mem(s, 'Aarav'), mem(s, 'Meera')];
    s = groupExp(s, 'e1', ME, 40000, [aarav, meera]);
    expect(groupPosition(s).receivableMinor).toBe(40000);
    expect(cashBalance(s)).toBe(960000);
  });
  it('rejects shares that do not reconcile', () => {
    const s = setup();
    expect(() => A.saveCircleExpense(s, { id: 'x', circleId: 'c1', title: 'x', payerId: ME, totalMinor: 1000, date: T, method: 'unequal', shares: { [ME]: 500 }, notes: '' }, 'create')).toThrow();
  });
  it('personal expense/commitments: pay, delete and recalc without double counting', () => {
    let s = setup();
    s = A.addCommitment(s, { id: 'k1', title: 'Hostel', amountMinor: 250000, dueDate: '2026-10-30', category: 'Bills', recurrence: 'none', notes: '' });
    expect(computeRunway(runwayInputFor(s, T)).reservedMinor).toBe(250000);
    s = A.payCommitment(s, 'k1', T);
    expect(cashBalance(s)).toBe(750000);
    expect(computeRunway(runwayInputFor(s, T)).reservedMinor).toBe(0);
    s = A.payCommitment(s, 'k1', T); // paying twice is a no-op
    expect(cashBalance(s)).toBe(750000);
    s = A.deletePersonalExpense(s, s.expenses[0].id);
    expect(cashBalance(s)).toBe(1000000);
    expect(s.commitments[0].status).toBe('unpaid');
    s = A.addPersonalExpense(s, { id: 'p1', title: 'Lunch', amountMinor: 15000, category: 'Food', date: T, notes: '' });
    expect(cashBalance(s)).toBe(985000);
    s = A.updatePersonalExpense(s, 'p1', { amountMinor: 20000 });
    expect(cashBalance(s)).toBe(980000);
  });
  it('setCurrentBalance rebases without touching the ledger', () => {
    let s = setup();
    s = A.addPersonalExpense(s, { id: 'p1', title: 'Lunch', amountMinor: 15000, category: 'Food', date: T, notes: '' });
    s = A.setCurrentBalance(s, 500000);
    expect(cashBalance(s)).toBe(500000);
    expect(s.expenses.length).toBe(1);
  });
  it('trailing spend falls back to the labelled estimate with little history', () => {
    const s = setup();
    expect(trailingSpend(s, T).source).toBe('none');
  });
  it('members used in the ledger cannot be removed', () => {
    let s = setup();
    s = groupExp(s, 'e1', ME, 40000, s.circles[0].members.map((m) => m.id));
    expect(() => A.removeMember(s, 'c1', mem(s, 'Aarav'))).toThrow();
    s = A.addMember(s, 'c1', 'Zoya');
    expect(() => A.removeMember(s, 'c1', mem(s, 'Zoya'))).not.toThrow();
  });
});

describe('vibe ledger & settle-up', () => {
  it('simplifies A→B→C into A→C', () => {
    const t = suggestSettlements({ A: -30000, B: 0, C: 30000 });
    expect(t).toEqual([{ fromId: 'A', toId: 'C', amountMinor: 30000 }]);
  });
  it('several debtors/creditors: transfers clear every net exactly', () => {
    const nets = { a: -5000, b: -7000, c: 9000, d: 3000, e: 0 };
    const t = suggestSettlements(nets);
    const after: Record<string, number> = { ...nets };
    for (const x of t) { after[x.fromId] += x.amountMinor; after[x.toId] -= x.amountMinor; }
    expect(Object.values(after).every((v) => v === 0)).toBe(true);
    expect(t.length).toBeLessThanOrEqual(3);
    expect(suggestSettlements(nets)).toEqual(t); // deterministic
  });
  it('threshold affects labels only, never balances', () => {
    expect(vibeStatus(0, 5000)).toBe('clear');
    expect(vibeStatus(4000, 5000)).toBe('buffered');
    expect(vibeStatus(-5000, 5000)).toBe('ready');
    let s = setup();
    const aarav = mem(s, 'Aarav');
    s = groupExp(s, 'e1', ME, 8000, [ME, aarav]); // aarav owes 4000
    const net1 = netPositions(s.circles[0], s.circleExpenses, s.settlements);
    s = A.updateCircle(s, 'c1', { vibeThresholdMinor: 100 });
    expect(netPositions(s.circles[0], s.circleExpenses, s.settlements)).toEqual(net1);
    expect(net1[aarav]).toBe(-4000);
  });
  it('accumulated small debts, nets sum to zero and match pair matrix', () => {
    let s = setup();
    const [aarav, meera] = [mem(s, 'Aarav'), mem(s, 'Meera')];
    const all = [ME, aarav, meera];
    s = groupExp(s, 'e1', aarav, 4000, all);
    s = groupExp(s, 'e2', meera, 6000, all);
    s = groupExp(s, 'e3', ME, 3000, all);
    const nets = netPositions(s.circles[0], s.circleExpenses, s.settlements);
    expect(Object.values(nets).reduce((a, b) => a + b, 0)).toBe(0);
    const pairs = buildPairs(s.circles[0], s.circleExpenses, s.settlements);
    expect(pairs[aarav][meera]).toBe(-pairs[meera][aarav]);
  });
  it('suggestions are not settlements: no cash change until recorded', () => {
    let s = setup();
    const aarav = mem(s, 'Aarav');
    s = groupExp(s, 'e1', aarav, 60000, s.circles[0].members.map((m) => m.id));
    const cash = cashBalance(s);
    suggestSettlements(netPositions(s.circles[0], s.circleExpenses, s.settlements));
    expect(cashBalance(s)).toBe(cash);
    expect(s.settlements.length).toBe(0);
  });
});

describe('receipt validation', () => {
  const good = { merchant: 'Campus Cafe', date: '2026-10-24', currency: 'INR', items: [
    { name: 'Sandwich', quantity: 2, unit_price_minor: 12000, line_total_minor: 24000 },
    { name: 'Coffee', quantity: 1, unit_price_minor: 8000, line_total_minor: 8000 }],
  subtotal_minor: 32000, tax_minor: 1600, tip_minor: 0, total_minor: 33600, uncertain_fields: [] };
  it('accepts valid JSON', () => {
    const v = validateReceipt(good);
    expect(v.ok).toBe(true);
    expect(v.warnings).toEqual([]);
  });
  it('rejects malformed output', () => {
    expect(validateReceipt('hello').ok).toBe(false);
    expect(validateReceipt({ items: 'x' }).ok).toBe(false);
    expect(validateReceipt({ items: [{ name: 'x', line_total_minor: 1.5 }] }).ok).toBe(false);
    expect(() => parseModelJson('not json')).toThrow();
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it('handles missing fields and flags inconsistent totals', () => {
    const v = validateReceipt({ items: [{ name: 'Tea', line_total_minor: 5000 }], total_minor: 9999 });
    expect(v.ok).toBe(true);
    expect(v.receipt!.items[0].quantity).toBe(1);
    expect(v.warnings.some((w) => /total/i.test(w))).toBe(true);
    expect(validateReceipt({ ...good, subtotal_minor: 1 }).warnings.length).toBeGreaterThan(0);
  });
  it('nothing is saved until the user confirms (validation alone leaves state untouched)', () => {
    const s = setup();
    validateReceipt(good);
    expect(s.circleExpenses.length).toBe(0);
  });
});

describe('hackathon demo sequence (Step 5)', () => {
  it('executes full demo sequence with exact accounting and runway metrics', () => {
    // 1. Open application: demo state loads with realistic student profile and no pre-existing circles
    let s = demoState(T);
    expect(s.onboarded).toBe(true);
    expect(s.profile.name).toBe('Riya');
    expect(s.circles.length).toBe(0); // user creates their own Circle during demo

    // 2. View dashboard: verify initial cash balance and daily spending limit
    const initialCash = cashBalance(s);
    expect(initialCash).toBe(788000); // ₹7,880.00 (₹9,000 opening − ₹1,120 personal expenses)
    const initialRunway = computeRunway(runwayInputFor(s, T));
    expect(initialRunway.dailyLimitMinor).toBe(35508); // floored daily limit based on flexible cash and remaining days
    expect(initialRunway.flexibleMinor).toBe(426100); // ₹4,261.00 flexible

    // 3. Add personal expense (e.g. ₹100 canteen snack)
    const expenseId = 'exp-test-1';
    s = A.addPersonalExpense(s, {
      id: expenseId,
      title: 'Canteen Coffee & Sandwich',
      amountMinor: 10000, // ₹100.00
      category: 'Food',
      date: T,
      notes: 'Quick snack between classes',
    });

    // 4. Confirm cash balance and daily limit update immediately
    const cashAfterPersonal = cashBalance(s);
    expect(cashAfterPersonal).toBe(initialCash - 10000); // drops by ₹100 exactly (778000)
    const runwayAfterPersonal = computeRunway(runwayInputFor(s, T));
    expect(runwayAfterPersonal.flexibleMinor).toBe(initialRunway.flexibleMinor - 10000); // 416100
    expect(runwayAfterPersonal.dailyLimitMinor).toBe(Math.floor(416100 / 12)); // 34675

    // 5. Create Circle during demo
    s = A.createCircle(s, {
      id: 'demo-circle',
      name: 'Campus Friends',
      emoji: '🏠',
      description: 'Demo circle',
      memberNames: ['Aarav', 'Meera', 'Kabir'],
      vibeThresholdMinor: 5000,
      settlementPref: 'manual',
    });
    const circle = s.circles[0];
    expect(circle.name).toBe('Campus Friends');
    const aarav = circle.members.find((m) => m.name === 'Aarav')!.id;
    const meera = circle.members.find((m) => m.name === 'Meera')!.id;
    const participants = [ME, aarav, meera]; // 3 participants

    // 6. Add ₹600 shared expense with 3 participants, paid by current user (ME)
    const split = computeShares({
      method: 'equal',
      totalMinor: 60000, // ₹600.00
      participantIds: participants,
    });
    expect(split.ok).toBe(true);
    expect(split.shares).toEqual({
      [ME]: 20000, // ₹200.00
      [aarav]: 20000, // ₹200.00
      [meera]: 20000, // ₹200.00
    });

    s = A.saveCircleExpense(s, {
      id: 'shared-exp-1',
      circleId: circle.id,
      title: 'Group Dinner at Cafe',
      payerId: ME,
      totalMinor: 60000,
      date: T,
      method: 'equal',
      shares: split.shares,
      notes: 'Shared equally between Riya, Aarav, and Meera',
    }, 'create');

    // 7. Confirm that the payer's cash decreases by ₹600
    expect(cashBalance(s)).toBe(cashAfterPersonal - 60000); // drops by full ₹600 actually paid

    // 8. Confirm that user's own share is ₹200 and outstanding receivable is ₹400
    const pos = groupPosition(s);
    expect(pos.receivableMinor).toBe(40000); // exactly ₹400 (40000 paise) owed to user
    expect(pos.payableMinor).toBe(0); // user owes 0

    // 9. Return to dashboard: Runway Meter reflects the new cash balance (receivable is NOT added to cash)
    const finalRunway = computeRunway(runwayInputFor(s, T));
    expect(finalRunway.flexibleMinor).toBe(Math.max(0, cashBalance(s) - runwayInputFor(s, T).commitmentsMinor - s.profile.safetyBufferMinor));

    // 10. Verify state serialization / persistence
    const serialized = JSON.stringify(s);
    const parsed = JSON.parse(serialized) as AppState;
    expect(cashBalance(parsed)).toBe(cashBalance(s));
    expect(groupPosition(parsed).receivableMinor).toBe(40000);
  });
});

