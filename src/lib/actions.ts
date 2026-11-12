import type {
  ActivityEvent, AppState, Circle, CircleExpense, Commitment, Member, PersonalExpense, Profile, Recurrence,
} from './types';
import { ME } from './types';
import { addDays, addMonths, isValidDate, todayStr } from './dates';
import { cashBalance } from './accounting';
import { formatMoney, sumValues } from './money';

/** Pure state transitions. They throw Error(message) on invalid input; the store keeps state unchanged. */

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const nowIso = () => new Date().toISOString();

export function emptyProfile(): Profile {
  return {
    name: '',
    currency: 'INR',
    openingBalanceMinor: 0,
    incomeMode: 'Unknown',
    nextIncomeDate: null,
    targetDays: null,
    estimatedDailySpendMinor: 0,
    safetyBufferMinor: 0,
    updatedAt: nowIso(),
  };
}

export function initialState(): AppState {
  return {
    version: 1,
    onboarded: false,
    isDemo: false,
    profile: emptyProfile(),
    expenses: [],
    commitments: [],
    circles: [],
    circleExpenses: [],
    settlements: [],
    events: [],
  };
}

function log(s: AppState, e: Omit<ActivityEvent, 'id' | 'at'>): AppState {
  return { ...s, events: [{ id: uid(), at: nowIso(), ...e }, ...s.events].slice(0, 500) };
}

const cur = (s: AppState) => s.profile.currency;
const money = (s: AppState, n: number) => formatMoney(n, cur(s));

function requireAmount(n: number, label = 'Amount') {
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${label} must be above zero.`);
}
function requireTitle(t: string) {
  if (!t.trim()) throw new Error('Add a name first.');
}
function requireDate(d: string, label = 'date') {
  if (!isValidDate(d)) throw new Error(`Enter a valid ${label}.`);
}

/* ------------------------------ profile ------------------------------ */

export function validateProfile(p: Profile) {
  if (p.incomeMode === 'ExactDate' && !isValidDate(p.nextIncomeDate)) throw new Error('Enter a valid allowance date.');
  if (p.incomeMode === 'TargetDays' && (!Number.isInteger(p.targetDays) || (p.targetDays ?? 0) <= 0))
    throw new Error('Planning days must be a whole number above zero.');
  if (p.safetyBufferMinor < 0 || p.estimatedDailySpendMinor < 0) throw new Error('Amounts cannot be negative.');
}

export function completeOnboarding(
  s: AppState,
  profile: Profile,
  commitments: Omit<Commitment, 'id' | 'status' | 'recurrence' | 'notes'>[],
): AppState {
  if (!profile.name.trim()) throw new Error('Tell us what to call you.');
  validateProfile(profile);
  const cs: Commitment[] = commitments.map((c) => {
    requireTitle(c.title);
    requireAmount(c.amountMinor);
    requireDate(c.dueDate, 'due date');
    return { ...c, id: uid(), status: 'unpaid', recurrence: 'none', notes: '' };
  });
  return { ...s, onboarded: true, isDemo: false, profile: { ...profile, updatedAt: nowIso() }, commitments: cs };
}

export function updateProfile(s: AppState, patch: Partial<Profile>): AppState {
  const profile = { ...s.profile, ...patch, updatedAt: nowIso() };
  if (!profile.name.trim()) throw new Error('Name cannot be empty.');
  validateProfile(profile);
  return { ...s, profile };
}

/** Re-base tracked cash so that the derived balance equals `newBalance` (no ledger rows are touched). */
export function setCurrentBalance(s: AppState, newBalanceMinor: number): AppState {
  if (!Number.isInteger(newBalanceMinor)) throw new Error('Enter a valid balance.');
  const delta = newBalanceMinor - cashBalance(s);
  return { ...s, profile: { ...s.profile, openingBalanceMinor: s.profile.openingBalanceMinor + delta, updatedAt: nowIso() } };
}

/* --------------------------- personal expenses --------------------------- */

export type NewExpense = Omit<PersonalExpense, 'createdAt' | 'updatedAt'>;

export function addPersonalExpense(s: AppState, e: NewExpense): AppState {
  if (s.expenses.some((x) => x.id === e.id)) return s; // same submission twice
  requireTitle(e.title);
  requireAmount(e.amountMinor);
  requireDate(e.date);
  const t = nowIso();
  const next = { ...s, expenses: [{ ...e, title: e.title.trim(), createdAt: t, updatedAt: t }, ...s.expenses] };
  return log(next, { type: 'personal_expense', title: e.title.trim(), detail: `${e.category} · paid from tracked cash`, amountMinor: e.amountMinor, refId: e.id });
}

export function updatePersonalExpense(s: AppState, id: string, patch: Partial<NewExpense>): AppState {
  const old = s.expenses.find((x) => x.id === id);
  if (!old) throw new Error('That expense no longer exists.');
  const merged = { ...old, ...patch, id, updatedAt: nowIso() };
  requireTitle(merged.title);
  requireAmount(merged.amountMinor);
  requireDate(merged.date);
  const next = { ...s, expenses: s.expenses.map((x) => (x.id === id ? merged : x)) };
  return log(next, {
    type: 'expense_edited',
    title: `Edited ${merged.title}`,
    detail: old.amountMinor !== merged.amountMinor ? `Amount changed from ${money(s, old.amountMinor)} to ${money(s, merged.amountMinor)}` : 'Details updated',
    amountMinor: merged.amountMinor,
    refId: id,
  });
}

export function deletePersonalExpense(s: AppState, id: string): AppState {
  const old = s.expenses.find((x) => x.id === id);
  if (!old) return s;
  let next: AppState = { ...s, expenses: s.expenses.filter((x) => x.id !== id) };
  // A deleted commitment payment re-opens the commitment so it is reserved for again.
  if (old.commitmentId) {
    next = { ...next, commitments: next.commitments.map((c) => (c.id === old.commitmentId ? { ...c, status: 'unpaid', paidExpenseId: undefined } : c)) };
  }
  return log(next, { type: 'expense_deleted', title: `Deleted ${old.title}`, detail: `${money(s, old.amountMinor)} returned to tracked cash`, amountMinor: old.amountMinor });
}

/* ------------------------------ commitments ------------------------------ */

export type NewCommitment = Omit<Commitment, 'status' | 'paidExpenseId'>;

export function addCommitment(s: AppState, c: NewCommitment): AppState {
  if (s.commitments.some((x) => x.id === c.id)) return s;
  requireTitle(c.title);
  requireAmount(c.amountMinor);
  requireDate(c.dueDate, 'due date');
  const next = { ...s, commitments: [...s.commitments, { ...c, title: c.title.trim(), status: 'unpaid' as const }] };
  return log(next, { type: 'commitment_added', title: `${c.title.trim()} added to Coming up`, detail: 'Reserved from your flexible balance', amountMinor: c.amountMinor, refId: c.id });
}

export function updateCommitment(s: AppState, id: string, patch: Partial<NewCommitment>): AppState {
  const old = s.commitments.find((x) => x.id === id);
  if (!old) throw new Error('That item no longer exists.');
  const merged = { ...old, ...patch, id };
  requireTitle(merged.title);
  requireAmount(merged.amountMinor);
  requireDate(merged.dueDate, 'due date');
  return { ...s, commitments: s.commitments.map((x) => (x.id === id ? merged : x)) };
}

export const deleteCommitment = (s: AppState, id: string): AppState => ({ ...s, commitments: s.commitments.filter((c) => c.id !== id) });

const nextDue = (due: string, r: Recurrence) => (r === 'weekly' ? addDays(due, 7) : addMonths(due, 1));

/**
 * Paying a commitment records ONE cash expense and flips the commitment to paid, so it stops being
 * reserved at the same moment cash drops — never both counted.
 */
export function payCommitment(s: AppState, id: string, date = todayStr(), paidAmountMinor?: number): AppState {
  const c = s.commitments.find((x) => x.id === id);
  if (!c || c.status === 'paid') return s;
  const amount = paidAmountMinor ?? c.amountMinor;
  requireAmount(amount);
  const expId = uid();
  const t = nowIso();
  const exp: PersonalExpense = { id: expId, title: c.title, amountMinor: amount, category: c.category, date, notes: c.notes, commitmentId: c.id, createdAt: t, updatedAt: t };
  const commitments = s.commitments.map((x) => (x.id === id ? { ...x, status: 'paid' as const, paidExpenseId: expId } : x));
  if (c.recurrence !== 'none') {
    commitments.push({ ...c, id: uid(), dueDate: nextDue(c.dueDate, c.recurrence), status: 'unpaid', paidExpenseId: undefined });
  }
  const next = { ...s, expenses: [exp, ...s.expenses], commitments };
  return log(next, { type: 'commitment_paid', title: `${c.title} marked paid`, detail: 'Moved from reserved to spent', amountMinor: amount, refId: id });
}

/* ------------------------------- circles ------------------------------- */

export function createCircle(
  s: AppState,
  input: { id: string; name: string; emoji: string; description: string; memberNames: string[]; vibeThresholdMinor: number; settlementPref: 'manual' | 'weekly' },
): AppState {
  if (s.circles.some((c) => c.id === input.id)) return s;
  if (!input.name.trim()) throw new Error('Give your Circle a name.');
  if (input.vibeThresholdMinor < 0) throw new Error('Threshold cannot be negative.');
  const names = input.memberNames.map((n) => n.trim()).filter(Boolean);
  const lower = names.map((n) => n.toLowerCase());
  if (new Set(lower).size !== lower.length) throw new Error('Each member needs a different name.');
  const members: Member[] = [{ id: ME, name: s.profile.name || 'You', sample: false }, ...names.map((n) => ({ id: uid(), name: n, sample: true }))];
  const circle: Circle = {
    id: input.id,
    name: input.name.trim(),
    emoji: input.emoji || '👥',
    description: input.description.trim(),
    currency: s.profile.currency,
    members,
    vibeThresholdMinor: input.vibeThresholdMinor,
    settlementPref: input.settlementPref,
    createdAt: nowIso(),
  };
  return log({ ...s, circles: [circle, ...s.circles] }, { type: 'circle_created', title: `Circle "${circle.name}" created`, detail: `${members.length} members`, circleId: circle.id });
}

export function updateCircle(s: AppState, id: string, patch: Partial<Pick<Circle, 'name' | 'emoji' | 'description' | 'vibeThresholdMinor' | 'settlementPref'>>): AppState {
  if (patch.name !== undefined && !patch.name.trim()) throw new Error('Give your Circle a name.');
  if (patch.vibeThresholdMinor !== undefined && patch.vibeThresholdMinor < 0) throw new Error('Threshold cannot be negative.');
  return { ...s, circles: s.circles.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

export function addMember(s: AppState, circleId: string, name: string): AppState {
  const n = name.trim();
  if (!n) throw new Error('Enter a name.');
  const c = s.circles.find((x) => x.id === circleId);
  if (!c) throw new Error('Circle not found.');
  if (c.members.some((m) => m.name.toLowerCase() === n.toLowerCase())) throw new Error('Someone with that name is already in this Circle.');
  return { ...s, circles: s.circles.map((x) => (x.id === circleId ? { ...x, members: [...x.members, { id: uid(), name: n, sample: true }] } : x)) };
}

/** Members referenced by any expense or settlement can't be removed (that would corrupt the ledger). */
export function removeMember(s: AppState, circleId: string, memberId: string): AppState {
  if (memberId === ME) throw new Error("You can't remove yourself.");
  const used =
    s.circleExpenses.some((e) => e.circleId === circleId && (e.payerId === memberId || memberId in e.shares)) ||
    s.settlements.some((x) => x.circleId === circleId && (x.fromId === memberId || x.toId === memberId));
  if (used) throw new Error('This member is part of recorded expenses, so they stay in the ledger to keep balances accurate.');
  return { ...s, circles: s.circles.map((c) => (c.id === circleId ? { ...c, members: c.members.filter((m) => m.id !== memberId) } : c)) };
}

/* --------------------------- circle expenses --------------------------- */

export type NewCircleExpense = Omit<CircleExpense, 'createdAt' | 'updatedAt'>;

function validateCircleExpense(s: AppState, e: NewCircleExpense) {
  const circle = s.circles.find((c) => c.id === e.circleId);
  if (!circle) throw new Error('Circle not found.');
  requireTitle(e.title);
  requireAmount(e.totalMinor, 'Total');
  requireDate(e.date);
  const ids = new Set(circle.members.map((m) => m.id));
  if (!ids.has(e.payerId)) throw new Error('Choose who paid.');
  const keys = Object.keys(e.shares);
  if (keys.length === 0 || keys.some((k) => !ids.has(k))) throw new Error('Participants must be Circle members.');
  if (Object.values(e.shares).some((v) => !Number.isInteger(v) || v < 0)) throw new Error('Shares must be zero or more.');
  if (sumValues(e.shares) !== e.totalMinor) throw new Error("Shares don't add up to the total yet.");
}

export function saveCircleExpense(s: AppState, e: NewCircleExpense, mode: 'create' | 'edit'): AppState {
  const exists = s.circleExpenses.find((x) => x.id === e.id);
  if (mode === 'create' && exists) return s; // duplicate submit
  if (mode === 'edit' && !exists) throw new Error('That expense no longer exists.');
  validateCircleExpense(s, e);
  const t = nowIso();
  const circle = s.circles.find((c) => c.id === e.circleId)!;
  const rec: CircleExpense = { ...e, title: e.title.trim(), createdAt: exists?.createdAt ?? t, updatedAt: t };
  const circleExpenses = exists ? s.circleExpenses.map((x) => (x.id === e.id ? rec : x)) : [rec, ...s.circleExpenses];
  const paidBy = circle.members.find((m) => m.id === e.payerId)!.name;
  const yours = e.shares[ME];
  if (exists) {
    return log({ ...s, circleExpenses }, {
      type: 'expense_edited', title: `Edited ${rec.title}`, detail: `${circle.name} · balances recalculated from the corrected expense`,
      amountMinor: rec.totalMinor, circleId: circle.id, refId: rec.id,
    });
  }
  return log({ ...s, circleExpenses }, {
    type: e.receipt ? 'receipt_confirmed' : 'circle_expense',
    title: e.receipt ? `Receipt confirmed: ${rec.title}` : rec.title,
    detail: `${circle.name} · ${e.payerId === ME ? 'You paid' : paidBy + ' paid'}${yours ? ` · your share ${money(s, yours)}` : ''}`,
    amountMinor: rec.totalMinor, circleId: circle.id, refId: rec.id,
  });
}

export function deleteCircleExpense(s: AppState, id: string): AppState {
  const old = s.circleExpenses.find((x) => x.id === id);
  if (!old) return s;
  const circle = s.circles.find((c) => c.id === old.circleId);
  return log({ ...s, circleExpenses: s.circleExpenses.filter((x) => x.id !== id) }, {
    type: 'expense_deleted', title: `Deleted ${old.title}`, detail: `${circle?.name ?? 'Circle'} · balances recalculated`, amountMinor: old.totalMinor, circleId: old.circleId,
  });
}

/* ----------------------------- settlements ----------------------------- */

export function recordSettlement(s: AppState, input: { id: string; circleId: string; fromId: string; toId: string; amountMinor: number }): AppState {
  if (s.settlements.some((x) => x.id === input.id)) return s;
  const circle = s.circles.find((c) => c.id === input.circleId);
  if (!circle) throw new Error('Circle not found.');
  const ids = new Set(circle.members.map((m) => m.id));
  if (!ids.has(input.fromId) || !ids.has(input.toId) || input.fromId === input.toId) throw new Error('Choose two different members.');
  requireAmount(input.amountMinor);
  const t = nowIso();
  const st = { ...input, status: 'recorded' as const, createdAt: t, confirmedAt: t };
  const name = (id: string) => (id === ME ? 'You' : circle.members.find((m) => m.id === id)!.name);
  return log({ ...s, settlements: [st, ...s.settlements] }, {
    type: 'settlement', title: `${name(input.fromId)} paid ${name(input.toId)}`, detail: `${circle.name} · settlement recorded`, amountMinor: input.amountMinor, circleId: circle.id, refId: input.id,
  });
}

export function cancelSettlement(s: AppState, id: string): AppState {
  const st = s.settlements.find((x) => x.id === id);
  if (!st || st.status === 'cancelled') return s;
  const circle = s.circles.find((c) => c.id === st.circleId);
  return log({ ...s, settlements: s.settlements.map((x) => (x.id === id ? { ...x, status: 'cancelled' as const, cancelledAt: nowIso() } : x)) }, {
    type: 'settlement_cancelled', title: 'Settlement cancelled', detail: `${circle?.name ?? 'Circle'} · balances restored`, amountMinor: st.amountMinor, circleId: st.circleId, refId: id,
  });
}
