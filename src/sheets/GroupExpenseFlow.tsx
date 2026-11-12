import { useMemo, useRef, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Avatar, Button, Field, MoneyInput, Notice, Segmented, Sheet, useToast, minorToInput } from '../components/ui';
import { useFinance } from '../hooks';
import { useStore } from '../store';
import type { Prefill } from '../ui-context';
import { saveCircleExpense, uid } from '../lib/actions';
import { cashBalance, groupPosition } from '../lib/accounting';
import { computeShares } from '../lib/split';
import { formatMoney, parseAmountToMinor, splitEqual } from '../lib/money';
import { isValidDate } from '../lib/dates';
import { ME, type ChargeRule, type Circle, type ReceiptItem, type SplitMethod } from '../lib/types';

interface ItemDraft { id: string; name: string; qty: string; unit: string; line: string; assignees: string[] }
const STEPS = ['Details', 'People', 'Split', 'Review', 'Confirm'];

const toDraft = (i: ReceiptItem): ItemDraft => ({ id: i.id, name: i.name, qty: String(i.quantity), unit: minorToInput(i.unitPriceMinor), line: minorToInput(i.lineTotalMinor), assignees: i.assignees });
const bpToStr = (bp: number) => String(bp / 100);
const strToBp = (s: string): number | null => (/^\d{1,3}(\.\d{1,2})?$/.test(s.trim()) ? Math.round(Number(s) * 100) : null);

export function GroupExpenseFlow({ circle, editId, prefill, onClose }: { circle: Circle; editId?: string; prefill?: Prefill; onClose: () => void }) {
  const f = useFinance();
  const { state, apply } = useStore();
  const toast = useToast();
  const draftId = useRef(editId ?? uid());
  const existing = editId ? state.circleExpenses.find((e) => e.id === editId) : undefined;
  const members = circle.members;
  const nm = (id: string) => (id === ME ? 'You' : members.find((m) => m.id === id)?.name ?? 'Former member');
  const money = (n: number) => formatMoney(n, circle.currency);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(existing?.title ?? prefill?.title ?? '');
  const [amount, setAmount] = useState(minorToInput(existing?.totalMinor ?? prefill?.amountMinor ?? 0));
  const [payer, setPayer] = useState(existing?.payerId ?? ME);
  const [date, setDate] = useState(existing?.date ?? prefill?.date ?? f.today);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [parts, setParts] = useState<string[]>(existing ? members.filter((m) => m.id in existing.shares).map((m) => m.id) : members.map((m) => m.id));
  const [method, setMethod] = useState<SplitMethod>(existing?.method ?? prefill?.method ?? 'equal');
  const [amounts, setAmounts] = useState<Record<string, string>>(existing?.method === 'unequal' ? Object.fromEntries(Object.entries(existing.shares).map(([k, v]) => [k, minorToInput(v)])) : {});
  const [pcts, setPcts] = useState<Record<string, string>>(existing?.basisPoints ? Object.fromEntries(Object.entries(existing.basisPoints).map(([k, v]) => [k, bpToStr(v)])) : {});
  const [items, setItems] = useState<ItemDraft[]>((existing?.items ?? prefill?.items ?? []).map(toDraft));
  const [tax, setTax] = useState(minorToInput(existing?.taxMinor ?? prefill?.taxMinor ?? 0));
  const [tip, setTip] = useState(minorToInput(existing?.tipMinor ?? prefill?.tipMinor ?? 0));
  const [disc, setDisc] = useState(minorToInput(existing?.discountMinor ?? prefill?.discountMinor ?? 0));
  const [rule, setRule] = useState<ChargeRule>(existing?.chargeRule ?? 'proportional');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const total = parseAmountToMinor(amount) ?? 0;
  const ordered = members.filter((m) => parts.includes(m.id)).map((m) => m.id);

  const parsedItems: ReceiptItem[] = items.map((i) => ({
    id: i.id, name: i.name.trim(), quantity: Number(i.qty) > 0 ? Number(i.qty) : 1,
    unitPriceMinor: parseAmountToMinor(i.unit || '0') ?? 0, lineTotalMinor: parseAmountToMinor(i.line || '0') ?? NaN, assignees: i.assignees,
  }));
  const bps = ordered.map((id) => strToBp(pcts[id] ?? '') ?? 0);

  const result = useMemo(() => computeShares({
    method, totalMinor: total, participantIds: ordered,
    amounts: Object.fromEntries(ordered.map((id) => [id, parseAmountToMinor(amounts[id] || '0') ?? 0])),
    basisPoints: Object.fromEntries(ordered.map((id, k) => [id, bps[k]])),
    items: parsedItems,
    taxMinor: parseAmountToMinor(tax || '0') ?? 0, tipMinor: parseAmountToMinor(tip || '0') ?? 0, discountMinor: parseAmountToMinor(disc || '0') ?? 0, chargeRule: rule,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [method, total, parts, amounts, pcts, items, tax, tip, disc, rule]);

  const toggle = (id: string) => setParts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const goNext = () => {
    setErr(null);
    if (step === 0) {
      if (!title.trim()) return setErr('Add a name for this expense.');
      if (!total) return setErr('Enter a total above zero.');
      if (!isValidDate(date)) return setErr('Pick a valid date.');
    }
    if (step === 1 && ordered.length === 0) return setErr('Choose at least one person.');
    if (step === 2 && method === 'percentage' && ordered.every((id) => !pcts[id])) {
      const eq = splitEqual(10000, ordered.length);
      setPcts(Object.fromEntries(ordered.map((id, k) => [id, bpToStr(eq[k])])));
      return setStep(3);
    }
    if (step === 3 && !result.ok) return setErr(result.errors[0] ?? 'Fix the split first.');
    setStep(step + 1);
  };

  const record = () => ({
    id: draftId.current, circleId: circle.id, title, payerId: payer, totalMinor: total, date, method, shares: result.shares, notes,
    basisPoints: method === 'percentage' ? Object.fromEntries(ordered.map((id, k) => [id, bps[k]])) : undefined,
    items: method === 'itemized' ? parsedItems.map((i) => ({ ...i, assignees: i.assignees.filter((a) => ordered.includes(a)) })) : undefined,
    taxMinor: method === 'itemized' ? parseAmountToMinor(tax || '0') ?? 0 : undefined,
    tipMinor: method === 'itemized' ? parseAmountToMinor(tip || '0') ?? 0 : undefined,
    discountMinor: method === 'itemized' ? parseAmountToMinor(disc || '0') ?? 0 : undefined,
    chargeRule: method === 'itemized' ? rule : undefined,
    receipt: existing?.receipt ?? prefill?.receipt,
  });

  // "How balances will change": run the real transition on a copy and compare derived numbers.
  const impact = useMemo(() => {
    if (step < 4 || !result.ok) return null;
    try {
      const next = saveCircleExpense(state, record(), existing ? 'edit' : 'create');
      return {
        cashBefore: cashBalance(state), cashAfter: cashBalance(next),
        netBefore: groupPosition(state).byCircle[circle.id] ?? 0, netAfter: groupPosition(next).byCircle[circle.id] ?? 0,
      };
    } catch { return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, result.ok]);

  const confirm = () => {
    setBusy(true);
    const r = apply((s) => saveCircleExpense(s, record(), existing ? 'edit' : 'create'));
    setBusy(false);
    if (!r.ok) return setErr(r.error); // inputs are preserved
    toast(existing ? 'Expense corrected. Balances recalculated.' : prefill?.receipt?.scanned ? 'Receipt confirmed and split.' : 'Split confirmed. Everyone\'s share is sorted.');
    onClose();
    window.location.hash = `/circles/${circle.id}`;
  };

  const setItem = (id: string, patch: Partial<ItemDraft>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const recalcLine = (i: ItemDraft, qty: string, unit: string) => {
    const u = parseAmountToMinor(unit || '0');
    const q = Number(qty);
    return u !== null && q > 0 ? minorToInput(Math.round(u * q)) : i.line;
  };
  const itemsSum = parsedItems.reduce((a, b) => a + (Number.isFinite(b.lineTotalMinor) ? b.lineTotalMinor : 0), 0);

  const footer = (
    <>
      {step > 0 && <Button onClick={() => { setErr(null); setStep(step - 1); }}>{step === 4 ? 'Back to edit' : 'Back'}</Button>}
      {step < 4 ? <Button variant="primary" onClick={goNext}>{step === 3 ? 'Looks right' : 'Continue'}</Button> : <Button variant="primary" loading={busy} onClick={confirm}>{existing ? 'Confirm correction' : prefill?.receipt?.scanned ? 'Confirm and split' : 'Confirm expense'}</Button>}
    </>
  );

  return (
    <Sheet wide title={existing ? 'Edit shared expense' : `${STEPS[step]} · ${circle.name}`} step={{ current: step + 1, total: 5 }} onClose={onClose} footer={footer}>
      <div className="stack">
        {prefill?.notes?.map((n, i) => <Notice key={i} tone="warn">{n}</Notice>)}

        {step === 0 && (
          <>
            <Field label={method === 'itemized' ? 'Bill total (as printed)' : 'Total amount'}>{(id) => <MoneyInput id={id} big value={amount} onChange={setAmount} currency={circle.currency} autoFocus />}</Field>
            <Field label="Expense name">{(id) => <input id={id} className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dinner at Campus Cafe" maxLength={60} />}</Field>
            <div className="summary-grid">
              <Field label="Who paid?">{(id) => <select id={id} className="input" value={payer} onChange={(e) => setPayer(e.target.value)}>{members.map((m) => <option key={m.id} value={m.id}>{nm(m.id)}</option>)}</select>}</Field>
              <Field label="Date">{(id) => <input id={id} type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
            </div>
            <Field label="Note (optional)">{(id) => <textarea id={id} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} />}</Field>
            {existing && <Notice tone="warn">Editing recalculates balances for everyone in this Circle from the corrected expense.</Notice>}
          </>
        )}

        {step === 1 && (
          <>
            <p className="muted">Who is sharing this? {payer !== ME || !parts.includes(payer) ? '' : ''}Pick everyone who should chip in.</p>
            <div className="stack-sm">
              {members.map((m) => (
                <button key={m.id} className="pick" aria-pressed={parts.includes(m.id)} onClick={() => toggle(m.id)}>
                  <Avatar name={nm(m.id)} size={34} /><span style={{ fontWeight: 560 }}>{nm(m.id)}</span>{m.sample && <span className="chip info">sample</span>}{m.id === payer && <span className="chip mint">paid</span>}
                  <span className="check" aria-hidden>{parts.includes(m.id) && <Check size={14} />}</span>
                </button>
              ))}
            </div>
            {!parts.includes(payer) && parts.length > 0 && <Notice tone="info">{nm(payer)} paid but isn't in the split, so everyone selected owes {nm(payer)} their full share.</Notice>}
          </>
        )}

        {step === 2 && (
          <>
            <Segmented<SplitMethod> label="Split method" value={method} onChange={setMethod} options={[{ value: 'equal', label: 'Equal' }, { value: 'unequal', label: 'Unequal' }, { value: 'percentage', label: '%' }, { value: 'itemized', label: 'Itemized' }]} />
            {method === 'equal' && <p className="muted">Split {money(total)} equally between {ordered.length} {ordered.length === 1 ? 'person' : 'people'}. Any leftover paise go to the first people in the list.</p>}
            {method === 'unequal' && (
              <div className="stack-sm">
                {ordered.map((id) => <div className="row" key={id}><Avatar name={nm(id)} size={30} /><span className="grow">{nm(id)}</span><div style={{ width: 150 }}><MoneyInput aria-label={`${nm(id)} amount`} value={amounts[id] ?? ''} onChange={(v) => setAmounts({ ...amounts, [id]: v })} currency={circle.currency} /></div></div>)}
                <p className={`small ${result.differenceMinor ? '' : 'muted'}`} role="status">{result.differenceMinor === 0 ? 'Adds up to the total.' : `${money(Math.abs(result.differenceMinor))} ${result.differenceMinor > 0 ? 'still to assign' : 'over the total'}.`}</p>
              </div>
            )}
            {method === 'percentage' && (
              <div className="stack-sm">
                {ordered.map((id) => <div className="row" key={id}><Avatar name={nm(id)} size={30} /><span className="grow">{nm(id)}</span><div className="money-wrap" style={{ width: 110 }}><span>%</span><input className="input num" aria-label={`${nm(id)} percent`} inputMode="decimal" value={pcts[id] ?? ''} onChange={(e) => /^\d{0,3}\.?\d{0,2}$/.test(e.target.value) && setPcts({ ...pcts, [id]: e.target.value })} /></div></div>)}
                <p className="small muted" role="status">Total: {bps.reduce((a, b) => a + b, 0) / 100}% (needs to be 100%)</p>
                <Button size="sm" onClick={() => { const eq = splitEqual(10000, ordered.length); setPcts(Object.fromEntries(ordered.map((id, k) => [id, bpToStr(eq[k])]))); }}>Make equal</Button>
              </div>
            )}
            {method === 'itemized' && (
              <div className="stack">
                {items.length === 0 && <Notice tone="info">Add each item from the bill, then tap who had it. Shared items can have several people.</Notice>}
                {items.map((it, idx) => (
                  <div className="item-card" key={it.id}>
                    <div className="row">
                      <input className="input grow" aria-label={`Item ${idx + 1} name`} placeholder="Item name" value={it.name} onChange={(e) => setItem(it.id, { name: e.target.value })} maxLength={80} />
                      <button className="icon-btn" aria-label={`Remove ${it.name || 'item'}`} onClick={() => setItems(items.filter((x) => x.id !== it.id))}><Trash2 size={18} /></button>
                    </div>
                    <div className="row">
                      <div style={{ width: 70 }}><input className="input num" aria-label={`${it.name || 'Item'} quantity`} inputMode="decimal" value={it.qty} onChange={(e) => /^\d{0,3}\.?\d{0,2}$/.test(e.target.value) && setItem(it.id, { qty: e.target.value, line: recalcLine(it, e.target.value, it.unit) })} /></div>
                      <span className="muted">×</span>
                      <div className="grow"><MoneyInput aria-label={`${it.name || 'Item'} unit price`} value={it.unit} onChange={(v) => setItem(it.id, { unit: v, line: recalcLine(it, it.qty, v) })} currency={circle.currency} /></div>
                      <span className="muted">=</span>
                      <div className="grow"><MoneyInput aria-label={`${it.name || 'Item'} line total`} value={it.line} onChange={(v) => setItem(it.id, { line: v })} currency={circle.currency} /></div>
                    </div>
                    <div className="tag-row" role="group" aria-label={`Who had ${it.name || 'this item'}`}>
                      {ordered.map((id) => <button key={id} className="chip" aria-pressed={it.assignees.includes(id)} onClick={() => setItem(it.id, { assignees: it.assignees.includes(id) ? it.assignees.filter((a) => a !== id) : [...it.assignees, id] })}>{nm(id)}</button>)}
                    </div>
                  </div>
                ))}
                <div className="row wrap">
                  <Button size="sm" onClick={() => setItems([...items, { id: uid(), name: '', qty: '1', unit: '', line: '', assignees: [] }])}><Plus size={16} /> Add item</Button>
                  {items.length > 0 && <Button size="sm" variant="ghost" onClick={() => setItems(items.map((i) => ({ ...i, assignees: ordered })))}>Share every item equally</Button>}
                </div>
                <div className="summary-grid">
                  <Field label="Tax">{(id) => <MoneyInput id={id} value={tax} onChange={setTax} currency={circle.currency} />}</Field>
                  <Field label="Tip / service charge">{(id) => <MoneyInput id={id} value={tip} onChange={setTip} currency={circle.currency} />}</Field>
                  <Field label="Discount">{(id) => <MoneyInput id={id} value={disc} onChange={setDisc} currency={circle.currency} />}</Field>
                  <Field label="Share tax & tip">{(id) => <select id={id} className="input" value={rule} onChange={(e) => setRule(e.target.value as ChargeRule)}><option value="proportional">In proportion to items</option><option value="equal">Equally</option></select>}</Field>
                </div>
                <div className="card tight num" aria-label="Reconciliation">
                  <div className="row between"><span className="muted">Items</span><span>{money(itemsSum)}</span></div>
                  <div className="row between"><span className="muted">Calculated total</span><strong>{money(result.calculatedTotalMinor ?? itemsSum)}</strong></div>
                  <div className="row between"><span className="muted">Bill total</span><strong>{money(total)}</strong></div>
                  {result.calculatedTotalMinor !== undefined && result.calculatedTotalMinor !== total && (
                    <div style={{ marginTop: 8 }}>
                      <Notice tone="warn">These totals don't match yet. Review the item amounts before saving. Difference: {money(Math.abs(total - result.calculatedTotalMinor))}.</Notice>
                      <Button size="sm" style={{ marginTop: 8 }} onClick={() => setAmount(minorToInput(result.calculatedTotalMinor ?? 0))}>Set bill total to {money(result.calculatedTotalMinor ?? 0)}</Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h3>Review shares</h3>
            <div className="card tight divide num">
              {ordered.map((id) => <div className="list-row" key={id}><Avatar name={nm(id)} size={32} /><span className="grow">{nm(id)}</span><strong>{money(result.shares[id] ?? 0)}</strong></div>)}
              <div className="list-row"><span className="grow muted">Total</span><strong>{money(Object.values(result.shares).reduce((a, b) => a + b, 0))}</strong></div>
            </div>
            {result.ok ? <Notice tone="success">Shares add up to {money(total)} exactly.{method === 'equal' && total % ordered.length !== 0 && ' Leftover paise were given to the first people in the list.'}</Notice> : result.errors.map((e, i) => <Notice key={i} tone="danger">{e}</Notice>)}
          </>
        )}

        {step === 4 && (
          <>
            <div className="card tight stack-sm">
              <div className="row between"><span className="muted">Paid by</span><strong>{nm(payer)}</strong></div>
              <div className="row between"><span className="muted">Total</span><strong className="num">{money(total)}</strong></div>
              {ordered.map((id) => <div className="row between" key={id}><span>{nm(id)}{id !== payer && ` owes ${nm(payer)}`}</span><span className="num">{money(result.shares[id] ?? 0)}</span></div>)}
            </div>
            {impact && (
              <Notice tone="mint">
                <strong>How this changes your numbers</strong><br />
                Tracked cash: {money(impact.cashBefore)} → {money(impact.cashAfter)}{payer === ME ? ` (you actually paid ${money(total)})` : ' (unchanged — you didn\'t pay)'}.<br />
                In this Circle: {netText(impact.netBefore, money)} → {netText(impact.netAfter, money)}.
              </Notice>
            )}
            {existing && <Notice tone="warn">This updates balances for every member in this Circle.</Notice>}
          </>
        )}
        {err && <Notice tone="danger">{err}</Notice>}
      </div>
    </Sheet>
  );
}

const netText = (n: number, money: (n: number) => string) => (n > 0 ? `you're owed ${money(n)}` : n < 0 ? `you owe ${money(-n)}` : 'all settled');
