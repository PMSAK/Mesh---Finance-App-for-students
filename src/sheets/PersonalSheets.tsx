import { useRef, useState } from 'react';
import { ScanLine, Trash2 } from 'lucide-react';
import { Button, ConfirmSheet, Field, MoneyInput, Notice, Segmented, Sheet, useToast, minorToInput } from '../components/ui';
import { useFinance } from '../hooks';
import { useStore } from '../store';
import { useUI } from '../ui-context';
import {
  addCommitment, addPersonalExpense, deleteCommitment, deletePersonalExpense, payCommitment, setCurrentBalance, uid,
  updateCommitment, updatePersonalExpense, updateProfile,
} from '../lib/actions';
import { previewPurchase } from '../lib/runway';
import { formatMoney, parseAmountToMinor } from '../lib/money';
import { addDays, formatDate, isValidDate } from '../lib/dates';
import { CATEGORIES, type IncomeMode, type Recurrence } from '../lib/types';

const CategorySelect = ({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) => (
  <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
);

/** Shows exactly how a cash payment would change the user's tracked cash and runway before saving. */
function ImpactLine({ amountMinor }: { amountMinor: number | null }) {
  const f = useFinance();
  if (!amountMinor) return null;
  const p = previewPurchase(f.input, amountMinor);
  const m = (n: number) => formatMoney(n, f.currency);
  const lim = (r: typeof p.before) => (r.dailyLimitMinor !== null ? `${m(r.dailyLimitMinor)}/day` : r.estimatedDaysLeft !== null ? `~${r.estimatedDaysLeft} days` : null);
  return (
    <Notice tone={p.verdict === 'ok' ? 'mint' : 'warn'}>
      Cash {m(f.cash)} → {m(f.cash - amountMinor)}.{lim(p.before) && lim(p.after) && <> Limit {lim(p.before)} → {lim(p.after)}.</>}
      {p.verdict === 'dips_buffer' && ' This dips into your safety buffer.'}
      {p.verdict === 'breaks_commitments' && " This leaves less cash than you've already reserved."}
    </Notice>
  );
}

export function AddExpenseSheet({ circleId, onClose }: { circleId?: string; onClose: () => void }) {
  const f = useFinance();
  const { state, apply } = useStore();
  const ui = useUI();
  const toast = useToast();
  const draftId = useRef(uid());
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(f.today);
  const [notes, setNotes] = useState('');
  const [paid, setPaid] = useState<'paid' | 'unpaid'>('paid');
  const [circle, setCircle] = useState(circleId ?? '');
  const [err, setErr] = useState<string | null>(null);
  const amt = parseAmountToMinor(amount);

  const save = () => {
    setErr(null);
    if (!amt || amt <= 0) return setErr('Enter an amount above zero.');
    if (!title.trim()) return setErr('Add a name for this expense.');
    if (!isValidDate(date)) return setErr('Pick a valid date.');
    if (circle) {
      ui.open({ k: 'circleExpense', circleId: circle, prefill: { title: title.trim(), amountMinor: amt, date } });
      return;
    }
    const r = paid === 'paid'
      ? apply((s) => addPersonalExpense(s, { id: draftId.current, title, amountMinor: amt, category, date, notes }))
      : apply((s) => addCommitment(s, { id: draftId.current, title, amountMinor: amt, dueDate: date, category, recurrence: 'none', notes }));
    if (!r.ok) return setErr(r.error);
    toast(paid === 'paid' ? 'Expense saved. Your runway has been updated.' : 'Saved to Coming up. It is now reserved in your runway.');
    onClose();
  };

  return (
    <Sheet title="Add expense" onClose={onClose} footer={<Button variant="primary" onClick={save}>{circle ? 'Continue to split' : 'Save expense'}</Button>}>
      <div className="stack">
        <Field label="Amount" error={amount && amt === null ? 'Enter a valid amount.' : null}>{(id) => <MoneyInput id={id} big value={amount} onChange={setAmount} currency={f.currency} autoFocus />}</Field>
        <Field label="Expense name">{(id) => <input id={id} className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lunch at canteen" maxLength={60} />}</Field>
        {!circle && (
          <>
            <div className="summary-grid">
              <Field label="Category">{(id) => <CategorySelect id={id} value={category} onChange={setCategory} />}</Field>
              <Field label={paid === 'paid' ? 'Date' : 'Due date'}>{(id) => <input id={id} type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
            </div>
            <div className="field"><span className="label">Payment</span>
              <Segmented<'paid' | 'unpaid'> label="Payment status" value={paid} onChange={setPaid} options={[{ value: 'paid', label: 'Already paid' }, { value: 'unpaid', label: 'Not paid yet' }]} />
              <span className="hint">{paid === 'paid' ? 'Paid from tracked cash — your balance drops now.' : "Not paid yet — we'll reserve it as an upcoming expense instead of subtracting cash."}</span>
            </div>
            {paid === 'paid' && <ImpactLine amountMinor={amt} />}
            <Field label="Note (optional)">{(id) => <textarea id={id} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} />}</Field>
          </>
        )}
        {circle && <Notice tone="info">Shared expenses are recorded once, in the Circle, so nothing is counted twice. Your cash only drops if you're the one who paid.</Notice>}
        {state.circles.length > 0 && (
          <Field label="Split with a Circle (optional)">{(id) => (
            <select id={id} className="input" value={circle} onChange={(e) => setCircle(e.target.value)}>
              <option value="">Just me</option>{state.circles.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          )}</Field>
        )}
        <Button variant="ghost" onClick={() => ui.open({ k: 'receipt', circleId: circle || undefined })}><ScanLine size={18} /> Scan a receipt instead</Button>
        {err && <Notice tone="danger">{err}</Notice>}
      </div>
    </Sheet>
  );
}

export function ExpenseDetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const f = useFinance();
  const { state, apply } = useStore();
  const toast = useToast();
  const e = state.expenses.find((x) => x.id === id);
  const [amount, setAmount] = useState(e ? minorToInput(e.amountMinor) : '');
  const [title, setTitle] = useState(e?.title ?? '');
  const [category, setCategory] = useState(e?.category ?? 'Other');
  const [date, setDate] = useState(e?.date ?? f.today);
  const [notes, setNotes] = useState(e?.notes ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  if (!e) return <Sheet title="Expense" onClose={onClose}><p className="muted">This expense no longer exists.</p></Sheet>;
  const amt = parseAmountToMinor(amount);
  const m = (n: number) => formatMoney(n, f.currency);

  const save = () => {
    if (!amt || amt <= 0) return setErr('Enter an amount above zero.');
    const r = apply((s) => updatePersonalExpense(s, id, { amountMinor: amt, title, category, date, notes }));
    if (!r.ok) return setErr(r.error);
    toast('Expense updated. Balances recalculated from the corrected amount.');
    onClose();
  };
  const del = () => {
    const r = apply((s) => deletePersonalExpense(s, id));
    if (!r.ok) { setConfirm(false); return setErr(r.error); }
    toast('Expense deleted.');
    onClose();
  };
  if (confirm) return (
    <ConfirmSheet title="Delete this expense?" danger confirmLabel="Delete" onClose={() => setConfirm(false)} onConfirm={del}
      body={<><p>{e.title} · {m(e.amountMinor)}</p><p className="muted">{m(e.amountMinor)} goes back into your tracked cash and your runway recalculates.{e.commitmentId && ' The linked upcoming expense becomes unpaid again.'}</p></>} />
  );
  return (
    <Sheet title="Expense details" onClose={onClose} footer={<><Button variant="danger" onClick={() => setConfirm(true)} aria-label="Delete expense"><Trash2 size={18} /></Button><Button variant="primary" onClick={save}>Save changes</Button></>}>
      <div className="stack">
        <Field label="Amount">{(i) => <MoneyInput id={i} big value={amount} onChange={setAmount} currency={f.currency} />}</Field>
        <Field label="Expense name">{(i) => <input id={i} className="input" value={title} onChange={(ev) => setTitle(ev.target.value)} maxLength={60} />}</Field>
        <div className="summary-grid">
          <Field label="Category">{(i) => <CategorySelect id={i} value={category} onChange={setCategory} />}</Field>
          <Field label="Date">{(i) => <input id={i} type="date" className="input" value={date} onChange={(ev) => setDate(ev.target.value)} />}</Field>
        </div>
        <Field label="Note">{(i) => <textarea id={i} className="input" value={notes} onChange={(ev) => setNotes(ev.target.value)} maxLength={200} />}</Field>
        {amt !== null && amt !== e.amountMinor && <Notice tone="info">Your tracked cash will be {m(f.cash + e.amountMinor - amt)} after this change (currently {m(f.cash)}).</Notice>}
        {err && <Notice tone="danger">{err}</Notice>}
      </div>
    </Sheet>
  );
}

export function CommitmentSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const f = useFinance();
  const { state, apply } = useStore();
  const toast = useToast();
  const draftId = useRef(uid());
  const c = id ? state.commitments.find((x) => x.id === id) : undefined;
  const [title, setTitle] = useState(c?.title ?? '');
  const [amount, setAmount] = useState(c ? minorToInput(c.amountMinor) : '');
  const [due, setDue] = useState(c?.dueDate ?? addDays(f.today, 7));
  const [category, setCategory] = useState(c?.category ?? 'Bills');
  const [rec, setRec] = useState<Recurrence>(c?.recurrence ?? 'none');
  const [notes, setNotes] = useState(c?.notes ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const amt = parseAmountToMinor(amount);

  const save = () => {
    if (!amt || amt <= 0) return setErr('Enter an amount above zero.');
    const r = apply((s) => (c ? updateCommitment(s, c.id, { title, amountMinor: amt, dueDate: due, category, recurrence: rec, notes }) : addCommitment(s, { id: draftId.current, title, amountMinor: amt, dueDate: due, category, recurrence: rec, notes })));
    if (!r.ok) return setErr(r.error);
    toast(c ? 'Upcoming expense updated.' : 'Added. This money is now reserved in your runway.');
    onClose();
  };
  if (confirm && c) return (
    <ConfirmSheet title="Remove this upcoming expense?" danger confirmLabel="Remove" onClose={() => setConfirm(false)}
      onConfirm={() => { apply((s) => deleteCommitment(s, c.id)); toast('Removed. It no longer reduces your flexible balance.'); onClose(); }}
      body={<p>{c.title} · {formatMoney(c.amountMinor, f.currency)} won't be reserved any more. No cash changes.</p>} />
  );
  return (
    <Sheet title={c ? 'Edit upcoming expense' : 'Add upcoming expense'} onClose={onClose}
      footer={<>{c && <Button variant="danger" onClick={() => setConfirm(true)} aria-label="Remove upcoming expense"><Trash2 size={18} /></Button>}<Button variant="primary" onClick={save}>{c ? 'Save changes' : 'Add to Coming up'}</Button></>}>
      <div className="stack">
        <Field label="Name">{(i) => <input id={i} className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hostel fees" maxLength={60} />}</Field>
        <Field label="Amount">{(i) => <MoneyInput id={i} big value={amount} onChange={setAmount} currency={f.currency} />}</Field>
        <div className="summary-grid">
          <Field label="Due date">{(i) => <input id={i} type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />}</Field>
          <Field label="Category">{(i) => <CategorySelect id={i} value={category} onChange={setCategory} />}</Field>
        </div>
        <Field label="Repeats">{(i) => (
          <select id={i} className="input" value={rec} onChange={(e) => setRec(e.target.value as Recurrence)}>
            <option value="none">Doesn't repeat</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select>
        )}</Field>
        <Field label="Note (optional)">{(i) => <textarea id={i} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} />}</Field>
        {c && c.status === 'unpaid' && (
          <Button onClick={() => { const r = apply((s) => payCommitment(s, c.id)); r.ok ? (toast(`${c.title} marked paid.`), onClose()) : setErr(r.error); }}>Mark as paid today ({formatMoney(c.amountMinor, f.currency)} leaves your cash)</Button>
        )}
        {err && <Notice tone="danger">{err}</Notice>}
      </div>
    </Sheet>
  );
}

export function AffordSheet({ onClose }: { onClose: () => void }) {
  const f = useFinance();
  const ui = useUI();
  const [amount, setAmount] = useState('');
  const amt = parseAmountToMinor(amount);
  const m = (n: number) => formatMoney(n, f.currency);
  const p = amt ? previewPurchase(f.input, amt) : null;
  const lim = (r: NonNullable<typeof p>['before']) => (r.dailyLimitMinor !== null ? `${m(r.dailyLimitMinor)}/day` : r.estimatedDaysLeft !== null ? `~${r.estimatedDaysLeft} days` : 'Not enough info');
  return (
    <Sheet title="Can I afford this?" onClose={onClose} footer={<><Button onClick={onClose}>Close</Button>{amt ? <Button variant="primary" onClick={() => ui.open({ k: 'expense' })}>Record it as an expense</Button> : null}</>}>
      <div className="stack">
        <Field label="Proposed purchase" hint="Preview only — nothing is recorded until you save an expense.">{(i) => <MoneyInput id={i} big autoFocus value={amount} onChange={setAmount} currency={f.currency} />}</Field>
        {p && amt && (
          <>
            <Notice tone={p.verdict === 'ok' ? 'success' : p.verdict === 'dips_buffer' ? 'warn' : 'danger'}>
              {p.verdict === 'ok' && "Looks fine. You'd still cover your upcoming expenses and keep your buffer."}
              {p.verdict === 'dips_buffer' && "You can cover your upcoming expenses, but this dips into your safety buffer."}
              {p.verdict === 'breaks_commitments' && "This would leave less cash than you've already set aside for upcoming expenses and money owed."}
            </Notice>
            <div className="card tight num">
              <div className="row between"><span className="muted">Flexible balance now</span><strong>{m(p.before.flexibleMinor)}</strong></div>
              <div className="row between"><span className="muted">This purchase</span><strong>−{m(amt)}</strong></div>
              <div className="row between"><span className="muted">Flexible after</span><strong>{m(p.flexibleAfterMinor)}</strong></div>
              <div className="row between"><span className="muted">Limit / runway now → after</span><strong>{lim(p.before)} → {lim(p.after)}</strong></div>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

/** Used by the "Update allowance" sheet and by Settings. Every save recalculates the runway immediately. */
export function FinanceForm({ onDone, submitLabel = 'Save changes' }: { onDone?: () => void; submitLabel?: string }) {
  const f = useFinance();
  const { state, apply } = useStore();
  const toast = useToast();
  const p = state.profile;
  const [balance, setBalance] = useState(minorToInput(f.cash));
  const [mode, setMode] = useState<IncomeMode>(p.incomeMode);
  const [date, setDate] = useState(p.nextIncomeDate ?? addDays(f.today, 14));
  const [days, setDays] = useState(String(p.targetDays ?? 14));
  const [buffer, setBuffer] = useState(minorToInput(p.safetyBufferMinor));
  const [est, setEst] = useState(minorToInput(p.estimatedDailySpendMinor));
  const [err, setErr] = useState<string | null>(null);

  const save = () => {
    const bal = parseAmountToMinor(balance || '0');
    const buf = parseAmountToMinor(buffer || '0');
    const es = parseAmountToMinor(est || '0');
    if (bal === null || buf === null || es === null) return setErr('Check the amounts — use numbers with up to 2 decimals.');
    const r = apply((s) => {
      let n = updateProfile(s, { incomeMode: mode, nextIncomeDate: mode === 'ExactDate' ? date : null, targetDays: mode === 'TargetDays' ? Number(days) : null, safetyBufferMinor: buf, estimatedDailySpendMinor: es });
      if (bal !== f.cash) n = setCurrentBalance(n, bal);
      return n;
    });
    if (!r.ok) return setErr(r.error);
    setErr(null);
    toast('Updated. Your runway has been recalculated.');
    onDone?.();
  };

  return (
    <div className="stack">
      <Field label="Tracked cash balance" hint="Changing this re-bases your tracked cash. It doesn't edit past expenses.">{(i) => <MoneyInput id={i} value={balance} onChange={setBalance} currency={f.currency} />}</Field>
      <div className="field"><span className="label">When does your money come in?</span>
        <Segmented<IncomeMode> label="Income mode" value={mode} onChange={setMode} options={[{ value: 'ExactDate', label: 'Exact date' }, { value: 'TargetDays', label: 'Target days' }, { value: 'Unknown', label: 'Not sure' }]} />
      </div>
      {mode === 'ExactDate' && <Field label="Next allowance date" hint={isValidDate(date) ? formatDate(date, f.today) : undefined}>{(i) => <input id={i} type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>}
      {mode === 'TargetDays' && <Field label="Days to budget for">{(i) => <input id={i} className="input" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} />}</Field>}
      {mode === 'Unknown' && <Notice tone="info">We'll estimate your runway from recent spending. Needs some expenses or a daily estimate below.</Notice>}
      <div className="summary-grid">
        <Field label="Safety buffer">{(i) => <MoneyInput id={i} value={buffer} onChange={setBuffer} currency={f.currency} />}</Field>
        <Field label="Daily spend estimate" hint="Only used when there isn't enough recorded spending.">{(i) => <MoneyInput id={i} value={est} onChange={setEst} currency={f.currency} />}</Field>
      </div>
      {err && <Notice tone="danger">{err}</Notice>}
      <Button variant="primary" onClick={save}>{submitLabel}</Button>
    </div>
  );
}

export function IncomeSheet({ onClose }: { onClose: () => void }) {
  return <Sheet title="Update allowance & balance" onClose={onClose}><FinanceForm onDone={onClose} /></Sheet>;
}
