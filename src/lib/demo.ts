import type { AppState } from './types';
import { addDays } from './dates';
import { initialState, nowIso as nowIsoSafe, uid } from './actions';

/** Clearly-labelled SAMPLE data: Personal student finances without pre-created circles. */
export function demoState(today: string): AppState {
  const base = initialState();
  const t = nowIsoSafe();
  return {
    ...base,
    onboarded: true,
    isDemo: true,
    profile: {
      name: 'Riya',
      currency: 'INR',
      openingBalanceMinor: 900000,
      incomeMode: 'ExactDate',
      nextIncomeDate: addDays(today, 12),
      targetDays: null,
      estimatedDailySpendMinor: 30000,
      safetyBufferMinor: 100000,
      updatedAt: t,
    },
    expenses: [
      { id: 'p1', title: 'Canteen lunch', amountMinor: 12000, category: 'Food', date: today, notes: '', createdAt: t, updatedAt: t },
      { id: 'p2', title: 'Metro card top-up', amountMinor: 20000, category: 'Transport', date: addDays(today, -1), notes: '', createdAt: t, updatedAt: t },
      { id: 'p3', title: 'Notebook & pens', amountMinor: 35000, category: 'Education', date: addDays(today, -3), notes: '', createdAt: t, updatedAt: t },
      { id: 'p4', title: 'Movie night', amountMinor: 45000, category: 'Entertainment', date: addDays(today, -6), notes: '', createdAt: t, updatedAt: t },
    ],
    commitments: [
      { id: 'c1', title: 'Hostel mess fee', amountMinor: 250000, dueDate: addDays(today, 7), category: 'Bills', status: 'unpaid', recurrence: 'monthly', notes: '' },
      { id: 'c2', title: 'Spotify student', amountMinor: 11900, dueDate: addDays(today, 3), category: 'Subscriptions', status: 'unpaid', recurrence: 'monthly', notes: '' },
    ],
    circles: [],
    circleExpenses: [],
    settlements: [],
    events: [
      { id: uid(), at: t, type: 'personal_expense', title: 'Canteen lunch', detail: 'Food · paid from tracked cash', amountMinor: 12000, refId: 'p1' },
      { id: uid(), at: addDays(today, -1), type: 'personal_expense', title: 'Metro card top-up', detail: 'Transport · paid from tracked cash', amountMinor: 20000, refId: 'p2' },
      { id: uid(), at: addDays(today, -3), type: 'personal_expense', title: 'Notebook & pens', detail: 'Education · paid from tracked cash', amountMinor: 35000, refId: 'p3' },
      { id: uid(), at: addDays(today, -6), type: 'personal_expense', title: 'Movie night', detail: 'Entertainment · paid from tracked cash', amountMinor: 45000, refId: 'p4' },
      { id: uid(), at: addDays(today, -7), type: 'commitment_added', title: 'Hostel mess fee added to Coming up', detail: 'Reserved from your flexible balance', amountMinor: 250000, refId: 'c1' },
    ],
  };
}
