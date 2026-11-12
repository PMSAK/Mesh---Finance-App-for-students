import { ArrowLeftRight, Bell, CalendarClock, Check, Pencil, Receipt, ScanLine, Trash2, UsersRound, HandCoins } from 'lucide-react';
import type { ActivityEvent, ActivityType, Commitment } from '../lib/types';
import { formatMoney } from '../lib/money';
import { formatDate, relativeTime, daysBetween } from '../lib/dates';
import { Button, CategoryIcon } from './ui';

const EV_ICON: Record<ActivityType, typeof Receipt> = {
  personal_expense: Receipt, commitment_added: CalendarClock, commitment_paid: Check, circle_created: UsersRound,
  circle_expense: HandCoins, receipt_confirmed: ScanLine, expense_edited: Pencil, expense_deleted: Trash2,
  settlement: ArrowLeftRight, settlement_cancelled: Bell,
};

export function ActivityRow({ e, currency, onClick }: { e: ActivityEvent; currency: string; onClick?: () => void }) {
  const I = EV_ICON[e.type];
  const body = (
    <>
      <span className="ico-box mint"><I size={20} aria-hidden /></span>
      <div className="grow">
        <div className="truncate" style={{ fontWeight: 560 }}>{e.title}</div>
        <div className="small muted truncate">{e.detail}</div>
      </div>
      <div className="right">
        {e.amountMinor !== undefined && <div className="num" style={{ fontWeight: 600 }}>{formatMoney(e.amountMinor, currency)}</div>}
        <div className="small muted">{relativeTime(e.at)}</div>
      </div>
    </>
  );
  return onClick ? <button className="list-row" onClick={onClick}>{body}</button> : <div className="list-row">{body}</div>;
}

export function CommitmentRow({ c, currency, today, onPay, onEdit }: { c: Commitment; currency: string; today: string; onPay?: () => void; onEdit?: () => void }) {
  const diff = daysBetween(today, c.dueDate);
  const overdue = c.status === 'unpaid' && diff < 0;
  return (
    <div className="list-row">
      <CategoryIcon category={c.category} />
      <button className="grow" style={{ background: 'none', border: 0, textAlign: 'left', padding: 0 }} onClick={onEdit} aria-label={`Edit ${c.title}`} disabled={!onEdit}>
        <div className="truncate" style={{ fontWeight: 560 }}>{c.title}</div>
        <div className="small muted">
          {c.status === 'paid' ? 'Paid' : overdue ? <span style={{ color: 'var(--warn)' }}>Overdue · was due {formatDate(c.dueDate, today)}</span> : `Due ${formatDate(c.dueDate, today)}`}
          {c.recurrence !== 'none' && ` · repeats ${c.recurrence}`}
        </div>
      </button>
      <div className="right">
        <div className="num" style={{ fontWeight: 600 }}>{formatMoney(c.amountMinor, currency)}</div>
        <span className={`chip ${c.status === 'paid' ? 'success' : 'warn'}`}>{c.status === 'paid' ? 'Paid' : 'Unpaid'}</span>
      </div>
      {onPay && c.status === 'unpaid' && <Button size="sm" onClick={onPay} aria-label={`Mark ${c.title} as paid`}>Paid</Button>}
    </div>
  );
}
