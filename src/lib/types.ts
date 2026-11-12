/** All money is integer minor units (paise for INR). Dates are local 'YYYY-MM-DD' strings. */
export type IncomeMode = 'ExactDate' | 'TargetDays' | 'Unknown';
export type SplitMethod = 'equal' | 'unequal' | 'percentage' | 'itemized';
export const ME = 'me';

export interface Profile {
  name: string;
  currency: string;
  /** Opening tracked cash. Current cash is DERIVED from this plus the ledger (see accounting.ts). */
  openingBalanceMinor: number;
  incomeMode: IncomeMode;
  nextIncomeDate: string | null;
  targetDays: number | null;
  /** User-entered estimate; only used when there is no measured spending history. */
  estimatedDailySpendMinor: number;
  safetyBufferMinor: number;
  updatedAt: string;
}

export interface PersonalExpense {
  id: string;
  title: string;
  amountMinor: number;
  category: string;
  date: string;
  notes: string;
  /** Set when this cash payment settled an upcoming commitment. */
  commitmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type Recurrence = 'none' | 'weekly' | 'monthly';
export interface Commitment {
  id: string;
  title: string;
  amountMinor: number;
  dueDate: string;
  category: string;
  status: 'unpaid' | 'paid';
  recurrence: Recurrence;
  notes: string;
  paidExpenseId?: string;
}

export interface Member {
  id: string;
  name: string;
  /** Demo participants are sample people; there are no real invitations/accounts. */
  sample: boolean;
}

export interface Circle {
  id: string;
  name: string;
  emoji: string;
  description: string;
  currency: string;
  members: Member[];
  vibeThresholdMinor: number;
  settlementPref: 'manual' | 'weekly';
  createdAt: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  assignees: string[];
}

export type ChargeRule = 'proportional' | 'equal';

export interface CircleExpense {
  id: string;
  circleId: string;
  title: string;
  payerId: string;
  totalMinor: number;
  date: string;
  method: SplitMethod;
  /** memberId -> share (sums exactly to totalMinor). Payer may or may not be included. */
  shares: Record<string, number>;
  notes: string;
  /** Percentage split inputs (basis points), kept so edits restore exactly what was entered. */
  basisPoints?: Record<string, number>;
  items?: ReceiptItem[];
  taxMinor?: number;
  tipMinor?: number;
  discountMinor?: number;
  chargeRule?: ChargeRule;
  receipt?: { merchant: string; scanned: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  circleId: string;
  fromId: string; // payer of the settlement
  toId: string;
  amountMinor: number;
  status: 'recorded' | 'cancelled';
  createdAt: string;
  confirmedAt: string;
  cancelledAt?: string;
}

export type ActivityType =
  | 'personal_expense'
  | 'commitment_added'
  | 'commitment_paid'
  | 'circle_created'
  | 'circle_expense'
  | 'receipt_confirmed'
  | 'expense_edited'
  | 'expense_deleted'
  | 'settlement'
  | 'settlement_cancelled';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  at: string;
  title: string;
  detail: string;
  amountMinor?: number;
  circleId?: string;
  refId?: string;
}

export interface AppState {
  version: 1;
  onboarded: boolean;
  isDemo: boolean;
  profile: Profile;
  expenses: PersonalExpense[];
  commitments: Commitment[];
  circles: Circle[];
  circleExpenses: CircleExpense[];
  settlements: Settlement[];
  events: ActivityEvent[];
}

export const CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Education', 'Shopping',
  'Entertainment', 'Subscriptions', 'Bills', 'Health', 'Other',
] as const;
