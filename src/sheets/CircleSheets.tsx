import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Avatar, Button, ConfirmSheet, Field, MoneyInput, Notice, Segmented, Sheet, useToast, minorToInput } from '../components/ui';
import { useStore } from '../store';
import { useUI } from '../ui-context';
import { addMember, cancelSettlement, createCircle, deleteCircleExpense, recordSettlement, removeMember, uid } from '../lib/actions';
import { buildPairs, netPositions, pairHistory, suggestSettlements, vibeStatus } from '../lib/ledger';
import { formatMoney, parseAmountToMinor } from '../lib/money';
import { formatDate, todayStr } from '../lib/dates';
import { ME } from '../lib/types';

const EMOJIS = ['🏠', '🍜', '🌴', '🎓', '🎮', '🛒', '🚌', '🎬'];
export const nameOf = (c: { members: { id: string; name: string }[] }, id: string) => (id === ME ? 'You' : c.members.find((m) => m.id === id)?.name ?? 'Former member');

export function CreateCircleSheet({ onClose }: { onClose: () => void }) {
  const { state, apply } = useStore();
  const ui = useUI();
  const toast = useToast();
  const draftId = useRef(uid());
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [desc, setDesc] = useState('');
  const [member, setMember] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [threshold, setThreshold] = useState('50');
  const [pref, setPref] = useState<'manual' | 'weekly'>('manual');
  const [err, setErr] = useState<string | null>(null);

  const addM = () => {
    const n = member.trim();
    if (!n) return;
    if (members.some((m) => m.toLowerCase() === n.toLowerCase()) || n.toLowerCase() === state.profile.name.toLowerCase()) return setErr('Each member needs a different name.');
    setErr(null);
    setMembers([...members, n]);
    setMember('');
  };
  const save = () => {
    const th = parseAmountToMinor(threshold || '0');
    if (th === null) return setErr('Enter a valid threshold.');
    const pending = member.trim();
    const names = pending && !members.includes(pending) ? [...members, pending] : members;
    const r = apply((s) => createCircle(s, { id: draftId.current, name, emoji, description: desc, memberNames: names, vibeThresholdMinor: th, settlementPref: pref }));
    if (!r.ok) return setErr(r.error);
    toast('Circle created.');
    onClose();
    ui.go(`/circles/${draftId.current}`);
  };

  return (
    <Sheet title="Create a Circle" onClose={onClose} footer={<Button variant="primary" onClick={save}>Create Circle</Button>}>
      <div className="stack">
        <Field label="Circle name">{(id) => <input id={id} className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flatmates, Weekend Trip" maxLength={40} />}</Field>
        <div className="field"><span className="label">Icon</span><div className="tag-row">{EMOJIS.map((e) => <button key={e} className="chip" style={{ fontSize: 18, padding: '4px 10px' }} aria-pressed={emoji === e} aria-label={`Icon ${e}`} onClick={() => setEmoji(e)}>{e}</button>)}</div></div>
        <Field label="Purpose (optional)">{(id) => <input id={id} className="input" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={80} />}</Field>
        <div className="field"><span className="label">Members</span>
          <div className="row"><Avatar name={state.profile.name} size={28} /><span>{state.profile.name} (you)</span></div>
          {members.map((m) => <div className="row" key={m}><Avatar name={m} size={28} /><span className="grow">{m}</span><span className="chip info">sample</span><button className="icon-btn" aria-label={`Remove ${m}`} onClick={() => setMembers(members.filter((x) => x !== m))}><X size={16} /></button></div>)}
          <div className="row"><input className="input" aria-label="Member name" placeholder="Add a friend's name" value={member} onChange={(e) => setMember(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addM())} maxLength={30} /><Button onClick={addM} aria-label="Add member"><Plus size={18} /></Button></div>
          <span className="hint">Friends are sample participants kept on this device. Mesh doesn't send invitations or create accounts for them.</span>
        </div>
        <Field label="Suggest settling when a balance reaches" hint="Only controls suggestions — never the underlying balance.">{(id) => <MoneyInput id={id} value={threshold} onChange={setThreshold} />}</Field>
        <div className="field"><span className="label">Settlement</span><Segmented<'manual' | 'weekly'> label="Settlement preference" value={pref} onChange={setPref} options={[{ value: 'manual', label: 'Whenever we choose' }, { value: 'weekly', label: 'Weekly reminder' }]} /></div>
        {err && <Notice tone="danger">{err}</Notice>}
      </div>
    </Sheet>
  );
}

export function MembersSheet({ circleId, onClose }: { circleId: string; onClose: () => void }) {
  const { state, apply } = useStore();
  const toast = useToast();
  const c = state.circles.find((x) => x.id === circleId);
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  if (!c) return null;
  const add = () => { const r = apply((s) => addMember(s, circleId, name)); r.ok ? (setName(''), setErr(null), toast('Member added.')) : setErr(r.error); };
  return (
    <Sheet title="Members" onClose={onClose}>
      <div className="stack">
        <div className="divide">
          {c.members.map((m) => (
            <div className="list-row" key={m.id}>
              <Avatar name={nameOf(c, m.id)} size={34} /><span className="grow">{nameOf(c, m.id)} {m.sample && <span className="chip info">sample</span>}</span>
              {m.id !== ME && <button className="icon-btn" aria-label={`Remove ${m.name}`} onClick={() => { const r = apply((s) => removeMember(s, circleId, m.id)); r.ok ? toast('Member removed.') : setErr(r.error); }}><Trash2 size={18} /></button>}
            </div>
          ))}
        </div>
        <div className="row"><input className="input" aria-label="New member name" placeholder="Add a friend's name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} maxLength={30} /><Button variant="primary" onClick={add}>Add</Button></div>
        <p className="hint">Sample participants only — no invitations are sent. Members who appear in recorded expenses stay in the ledger so balances remain accurate.</p>
        {err && <Notice tone="danger">{err}</Notice>}
      </div>
    </Sheet>
  );
}

export function SettleSheet({ circleId, onClose }: { circleId: string; onClose: () => void }) {
  const { state, apply } = useStore();
  const toast = useToast();
  const c = state.circles.find((x) => x.id === circleId);
  const [confirming, setConfirming] = useState<{ key: string; id: string; amount: string } | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const nets = useMemo(() => (c ? netPositions(c, state.circleExpenses, state.settlements) : {}), [c, state.circleExpenses, state.settlements]);
  const transfers = useMemo(() => suggestSettlements(nets), [nets]);
  if (!c) return null;
  const m = (n: number) => formatMoney(n, c.currency);
  const recorded = state.settlements.filter((s) => s.circleId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const record = (from: string, to: string, max: number) => {
    const amt = parseAmountToMinor(confirming?.amount ?? '');
    if (!amt || amt <= 0) return setErr('Enter an amount above zero.');
    if (amt > max) return setErr(`That's more than the suggested ${m(max)}.`);
    const r = apply((s) => recordSettlement(s, { id: confirming!.id, circleId: c.id, fromId: from, toId: to, amountMinor: amt }));
    if (!r.ok) return setErr(r.error);
    setErr(null);
    setConfirming(null);
    toast(`Settlement of ${m(amt)} recorded.`);
  };

  if (cancelId) {
    const st = state.settlements.find((x) => x.id === cancelId)!;
    return <ConfirmSheet title="Cancel this settlement?" danger confirmLabel="Cancel settlement" onClose={() => setCancelId(null)}
      onConfirm={() => { apply((s) => cancelSettlement(s, cancelId)); setCancelId(null); toast('Settlement cancelled. Balances restored.'); }}
      body={<><p>{nameOf(c, st.fromId)} paid {nameOf(c, st.toId)} {m(st.amountMinor)}.</p><p className="muted">The balance owed comes back{(st.fromId === ME || st.toId === ME) && ', and your tracked cash is adjusted back'}.</p></>} />;
  }

  return (
    <Sheet wide title="Settle up" onClose={onClose}>
      <div className="stack">
        <p className="muted">Find a simpler way to clear outstanding balances.</p>
        <div className="card tight">
          <h3 style={{ marginBottom: 6 }}>Current balances</h3>
          <div className="divide">
            {c.members.map((mem) => { const n = nets[mem.id] ?? 0; return (
              <div className="list-row" key={mem.id}><Avatar name={nameOf(c, mem.id)} size={30} /><span className="grow">{nameOf(c, mem.id)}</span>
                <span className="num right">{n > 0 ? <>Is owed <strong>{m(n)}</strong></> : n < 0 ? <>Owes <strong>{m(-n)}</strong></> : <span className="muted">All square</span>}</span></div>
            ); })}
          </div>
        </div>
        <div>
          <h3 style={{ marginBottom: 8 }}>Suggested transfers</h3>
          {transfers.length === 0 ? <Notice tone="success">Everyone is square. Nothing to settle.</Notice> : (
            <div className="stack-sm">
              {transfers.map((t) => {
                const key = `${t.fromId}>${t.toId}`;
                const open = confirming?.key === key;
                return (
                  <div className="card tight" key={key}>
                    <div className="row">
                      <Avatar name={nameOf(c, t.fromId)} size={34} /><ArrowRight size={16} aria-hidden /><Avatar name={nameOf(c, t.toId)} size={34} />
                      <div className="grow"><strong>{nameOf(c, t.fromId)} pay{t.fromId === ME ? '' : 's'} {nameOf(c, t.toId)}</strong><div className="small muted">{open ? 'Awaiting your confirmation' : 'Suggested — not paid yet'}</div></div>
                      <strong className="num">{m(t.amountMinor)}</strong>
                    </div>
                    {!open ? (
                      <Button size="sm" style={{ marginTop: 10 }} onClick={() => { setErr(null); setConfirming({ key, id: uid(), amount: minorToInput(t.amountMinor) }); }}>Mark as settled…</Button>
                    ) : (
                      <div className="stack-sm" style={{ marginTop: 10 }}>
                        <Notice tone="info">Only confirm if this payment really happened outside Mesh. Mesh doesn't move money.{t.fromId === ME && ' Your tracked cash will go down by this amount.'}{t.toId === ME && ' Your tracked cash will go up by this amount.'}</Notice>
                        <Field label="Amount actually paid (partial is fine)">{(id) => <MoneyInput id={id} value={confirming!.amount} onChange={(v) => setConfirming({ ...confirming!, amount: v })} currency={c.currency} />}</Field>
                        <div className="row"><Button onClick={() => { setConfirming(null); setErr(null); }}>Not yet</Button><Button variant="primary" onClick={() => record(t.fromId, t.toId, t.amountMinor)}>Yes, record it</Button></div>
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="small muted">These transfers settle the group's current net balances with fewer individual payments.</p>
            </div>
          )}
        </div>
        {err && <Notice tone="danger">{err}</Notice>}
        {recorded.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 6 }}>Recorded</h3>
            <div className="divide">
              {recorded.map((s) => (
                <div className="list-row" key={s.id}>
                  <div className="grow"><div style={{ fontWeight: 560 }}>{nameOf(c, s.fromId)} paid {nameOf(c, s.toId)}</div><div className="small muted">{formatDate(s.confirmedAt.slice(0, 10), todayStr())}</div></div>
                  <span className="num" style={s.status === 'cancelled' ? { textDecoration: 'line-through' } : undefined}>{m(s.amountMinor)}</span>
                  {s.status === 'recorded' ? <><span className="chip success">Recorded as settled</span><Button size="sm" variant="ghost" onClick={() => setCancelId(s.id)}>Cancel</Button></> : <span className="chip">Cancelled</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

export function PairSheet({ circleId, otherId, onClose }: { circleId: string; otherId: string; onClose: () => void }) {
  const { state } = useStore();
  const ui = useUI();
  const c = state.circles.find((x) => x.id === circleId);
  if (!c) return null;
  const m = (n: number) => formatMoney(n, c.currency);
  const bal = buildPairs(c, state.circleExpenses, state.settlements)[ME]?.[otherId] ?? 0;
  const rows = pairHistory(c, state.circleExpenses, state.settlements, ME, otherId);
  const status = vibeStatus(bal, c.vibeThresholdMinor);
  return (
    <Sheet title={`You & ${nameOf(c, otherId)}`} onClose={onClose} footer={bal !== 0 ? <Button variant="primary" onClick={() => ui.open({ k: 'settle', circleId })}>Settle up</Button> : undefined}>
      <div className="stack">
        <Notice tone="mint"><strong>{bal > 0 ? `${nameOf(c, otherId)} owes you ${m(bal)}` : bal < 0 ? `You owe ${nameOf(c, otherId)} ${m(-bal)}` : 'All square'}</strong>{status === 'buffered' && ' · Buffered: small enough to wait. Still counted, nothing is forgiven.'}{status === 'ready' && ' · Ready to settle whenever you like.'}</Notice>
        <h3>What adds up to this</h3>
        {rows.length === 0 ? <p className="muted">No shared expenses between you two yet.</p> : (
          <div className="divide">{rows.map((r) => (
            <button key={r.kind + r.id} className="list-row" disabled={r.kind !== 'expense'} onClick={() => ui.open({ k: 'circleExpenseDetail', id: r.id })}>
              <div className="grow"><div style={{ fontWeight: 560 }}>{r.title}</div><div className="small muted">{formatDate(r.date, todayStr())} · {r.kind === 'settlement' ? 'payment recorded' : r.deltaMinor > 0 ? `${nameOf(c, otherId)}'s share, you paid` : `your share, ${nameOf(c, otherId)} paid`}</div></div>
              <span className="num">{r.deltaMinor > 0 ? '+' : '−'}{m(Math.abs(r.deltaMinor))}</span>
            </button>))}</div>
        )}
      </div>
    </Sheet>
  );
}

export function CircleExpenseDetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, apply } = useStore();
  const ui = useUI();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const e = state.circleExpenses.find((x) => x.id === id);
  const c = e && state.circles.find((x) => x.id === e.circleId);
  if (!e || !c) return <Sheet title="Expense" onClose={onClose}><p className="muted">This expense no longer exists.</p></Sheet>;
  const m = (n: number) => formatMoney(n, c.currency);
  if (confirm) return (
    <ConfirmSheet title="Delete this shared expense?" danger confirmLabel="Delete" onClose={() => setConfirm(false)}
      onConfirm={() => { const r = apply((s) => deleteCircleExpense(s, id)); r.ok ? (toast('Expense deleted. Balances recalculated.'), onClose()) : toast(r.error, 'error'); }}
      body={<><p>{e.title} · {m(e.totalMinor)}</p><p className="muted">This changes balances for everyone in {c.name}. {e.payerId === ME && `${m(e.totalMinor)} returns to your tracked cash.`}</p></>} />
  );
  return (
    <Sheet title={e.title} onClose={onClose} footer={<><Button variant="danger" aria-label="Delete expense" onClick={() => setConfirm(true)}><Trash2 size={18} /></Button><Button variant="primary" onClick={() => ui.open({ k: 'circleExpense', circleId: c.id, editId: e.id })}><Pencil size={16} /> Edit</Button></>}>
      <div className="stack">
        <div className="card tight stack-sm num">
          <div className="row between"><span className="muted">Circle</span><span>{c.emoji} {c.name}</span></div>
          <div className="row between"><span className="muted">Paid by</span><strong>{nameOf(c, e.payerId)}</strong></div>
          <div className="row between"><span className="muted">Total</span><strong>{m(e.totalMinor)}</strong></div>
          <div className="row between"><span className="muted">Date</span><span>{formatDate(e.date)}</span></div>
          <div className="row between"><span className="muted">Split</span><span style={{ textTransform: 'capitalize' }}>{e.method}</span></div>
          {e.payerId === ME && <div className="small muted">Your tracked cash dropped by {m(e.totalMinor)} — the amount you actually paid.</div>}
        </div>
        <h3>Each person's share</h3>
        <div className="divide num">{Object.entries(e.shares).map(([mid, v]) => <div className="list-row" key={mid}><Avatar name={nameOf(c, mid)} size={30} /><span className="grow">{nameOf(c, mid)}{mid === e.payerId ? ' (paid)' : ''}</span><strong>{m(v)}</strong></div>)}</div>
        {e.items && e.items.length > 0 && (
          <>
            <h3>{e.receipt?.scanned ? `Receipt · ${e.receipt.merchant || 'scanned'}` : 'Items'}</h3>
            <div className="divide num">{e.items.map((i) => <div className="list-row" key={i.id}><div className="grow"><div>{i.name}</div><div className="small muted">{i.assignees.map((a) => nameOf(c, a)).join(', ')}</div></div><span>{m(i.lineTotalMinor)}</span></div>)}
              {!!e.taxMinor && <div className="list-row"><span className="grow muted">Tax</span><span>{m(e.taxMinor)}</span></div>}
              {!!e.tipMinor && <div className="list-row"><span className="grow muted">Tip / service</span><span>{m(e.tipMinor)}</span></div>}
              {!!e.discountMinor && <div className="list-row"><span className="grow muted">Discount</span><span>−{m(e.discountMinor)}</span></div>}</div>
          </>
        )}
        {e.notes && <p className="muted">“{e.notes}”</p>}
      </div>
    </Sheet>
  );
}
