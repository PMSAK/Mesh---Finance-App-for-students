import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReceiptItem } from './lib/types';

export interface Prefill {
  title?: string;
  amountMinor?: number;
  date?: string;
  method?: 'itemized';
  items?: ReceiptItem[];
  taxMinor?: number;
  tipMinor?: number;
  discountMinor?: number;
  chargeRule?: import('./lib/types').ChargeRule;
  receipt?: { merchant: string; scanned: boolean };
  /** Messages the user must see about uncertain / mismatched fields. */
  notes?: string[];
}

export type SheetSpec =
  | { k: 'expense'; circleId?: string }
  | { k: 'expenseDetail'; id: string }
  | { k: 'commitment'; id?: string }
  | { k: 'afford' }
  | { k: 'income' }
  | { k: 'circleExpense'; circleId: string; editId?: string; prefill?: Prefill }
  | { k: 'receipt'; circleId?: string }
  | { k: 'circle' }
  | { k: 'settle'; circleId: string }
  | { k: 'circleExpenseDetail'; id: string }
  | { k: 'members'; circleId: string }
  | { k: 'pair'; circleId: string; otherId: string }
  | { k: 'coach' };

interface UI {
  open: (s: SheetSpec) => void;
  close: () => void;
  go: (path: string) => void;
  path: string;
}
export const UICtx = createContext<UI | null>(null);
export const useUI = () => {
  const c = useContext(UICtx);
  if (!c) throw new Error('UI context missing');
  return c;
};

const read = () => window.location.hash.replace(/^#/, '') || '/';
export function useHashRoute() {
  const [path, setPath] = useState(read);
  useEffect(() => {
    const f = () => { setPath(read()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  const go = useCallback((p: string) => { window.location.hash = p; }, []);
  return { path, go };
}
