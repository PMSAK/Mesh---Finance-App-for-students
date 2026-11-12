import { useState } from 'react';
import { ArrowLeft, HandCoins, Plus, ScanLine, Users, UsersRound, ArrowLeftRight, Settings2 } from 'lucide-react';
import { Avatar, AvatarStack, Button, Card, Empty, Notice, MoneyInput, Field, useToast, minorToInput } from '../components/ui';
import { useStore } from '../store';
import { useUI } from '../ui-context';
import { useFinance } from '../hooks';
import { buildPairs, netPositions, vibeStatus } from '../lib/ledger';
import { updateCircle } from '../lib/actions';
import { formatMoney, parseAmountToMinor } from '../lib/money';
import { formatDate } from '../lib/dates';
import { positionText } from '../lib/text';
import { ME, type Circle } from '../lib/types';
import { nameOf } from '../sheets/CircleSheets';

export function Circles() {
  const { state } = useStore();
  const ui = useUI();
  const f = useFinance();
  return (
    <>
      <div className="page-head">
        <div><h1>Your Circles</h1><p>Shared plans, sorted finances.</p></div>
        <Button variant="primary" onClick={() => ui.open({ k: 'circle' })}><Plus size={18} /> Create a Circle</Button>
      </div>
      {state.isDemo && <div className="demo-banner"><Users size={16} /> Sample Circle with sample friends (demo data).</div>}
      {state.circles.length === 0 ? (
        <Card><Empty icon={UsersRound} title="Got a group expense? Give it a home." text="Create a Circle to manage shared expenses with friends — splits, balances and settle-ups in one place." action={<Button variant="primary" onClick={() => ui.open({ k: 'circle' })}>Create your first Circle</Button>} /></Card>
      ) : (
        <div className="grid-cards">
          {state.circles.map((c) => {
            const net = f.group.byCircle[c.id] ?? 0;
            const last = state.circleExpenses.find((e) => e.circleId === c.id);
            const open = Object.values(netPositions(c, state.circleExpenses, state.settlements)).some((v) => v !== 0);
            return (
              <button key={c.id} className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => ui.go(`/circles/${c.id}`)} aria-label={`Open ${c.name}`}>
                <div className="row">
                  <span className="circle-emoji" aria-hidden>{c.emoji}</span>
                  <div className="grow"><h3 className="truncate">{c.name}</h3><div className="small muted">{c.members.length} members</div></div>
                  <AvatarStack names={c.members.map((m) => nameOf(c, m.id))} />
                </div>
                <div className="row between" style={{ marginTop: 14 }}>
                  <strong>{positionText(net, c.currency)}</strong>
                  {open ? <span className="chip warn">Unsettled balances</span> : <span className="chip success">All settled</span>}
                </div>
                <div className="small muted truncate" style={{ marginTop: 4 }}>{last ? `Latest: ${last.title} · ${formatDate(last.date, f.today)}` : 'No expenses yet'}</div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

type Tab = 'overview' | 'expenses' | 'ledger';

export function CircleDetail({ id }: { id: string }) {
  const { state } = useStore();
  const ui = useUI();
  const [tab, setTab] = useState<Tab>('overview');
  const c = state.circles.find((x) => x.id === id);
  if (!c) return <Card><Empty icon={UsersRound} title="Circle not found." text="It may have been removed on this device." action={<Button onClick={() => ui.go('/circles')}>Back to Circles</Button>} /></Card>;

  const m = (n: number) => formatMoney(n, c.currency);
  const expenses = state.circleExpenses.filter((e) => e.circleId === c.id);
  const nets = netPositions(c, state.circleExpenses, state.settlements);
  const pairs = buildPairs(c, state.circleExpenses, state.settlements);
  const myNet = nets[ME] ?? 0;
  const outstanding = Object.values(nets).filter((v) => v > 0).reduce((a, b) => a + b, 0);
  const anyReady = c.members.some((mem) => mem.id !== ME && vibeStatus(pairs[ME]?.[mem.id] ?? 0, c.vibeThresholdMinor) === 'ready');
  const names = c.members.map((x) => nameOf(c, x.id));

  return (
    <>
      <button className="link" onClick={() => ui.go('/circles')} style={{ marginBottom: 8 }}><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> All Circles</button>
      <div className="page-head">
        <div className="row"><span className="circle-emoji" aria-hidden>{c.emoji}</span>
          <div><h1>{c.name}</h1><div className="row" style={{ gap: 8, marginTop: 2 }}><AvatarStack names={names} size={24} /><span className="small muted">{c.members.length} members{c.description && ` · ${c.description}`}</span></div></div>
        </div>
        <Button size="sm" onClick={() => ui.open({ k: 'members', circleId: c.id })}><Settings2 size={16} /> Members</Button>
      </div>

      <Card className="" tight>
        <div className="row between wrap">
          <div><div className="label">Your position</div><div style={{ fontSize: 24, fontWeight: 650 }} className="num pop" key={myNet}>{positionText(myNet, c.currency)}</div>
            <div className="small muted">{outstanding > 0 ? `${m(outstanding)} unsettled across the group.` : 'Nothing outstanding in the group.'}</div></div>
          <div className="row wrap">
            <Button variant="primary" onClick={() => ui.open({ k: 'circleExpense', circleId: c.id })}><Plus size={18} /> Add expense</Button>
            <Button onClick={() => ui.open({ k: 'receipt', circleId: c.id })}><ScanLine size={18} /> Scan receipt</Button>
            <Button onClick={() => ui.open({ k: 'settle', circleId: c.id })}><ArrowLeftRight size={18} /> Settle up</Button>
          </div>
        </div>
        {myNet > 0 && <div style={{ marginTop: 10 }}><Notice tone="info">The {m(myNet)} owed to you is not cash yet. It won't count toward your balance or daily limit until it's settled.</Notice></div>}
      </Card>

      <div className="tabs" role="tablist" style={{ marginTop: 16 }}>
        {(['overview', 'expenses', 'ledger'] as Tab[]).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t === 'overview' ? 'Overview' : t === 'expenses' ? 'Expenses' : 'Vibe Ledger'}</button>)}
      </div>

      {tab === 'overview' && (
        <div className="stack">
          {anyReady && <Notice tone="mint">Some small balances have added up. Want to settle them together? <button className="link" onClick={() => setTab('ledger')}>Review balances</button></Notice>}
          <Card tight>
            <div className="card-title"><h3>Member balances</h3></div>
            <div className="divide">{c.members.map((mem) => { const n = nets[mem.id] ?? 0; return (
              <div className="list-row" key={mem.id}><Avatar name={nameOf(c, mem.id)} size={34} /><span className="grow">{nameOf(c, mem.id)}{mem.sample && <span className="chip info" style={{ marginLeft: 6 }}>sample</span>}</span>
                <span className="num right">{n > 0 ? <>is owed <strong>{m(n)}</strong></> : n < 0 ? <>owes <strong>{m(-n)}</strong></> : <span className="muted">all square</span>}</span></div>); })}</div>
          </Card>
          <Card tight>
            <div className="card-title"><h3>Recent expenses</h3>{expenses.length > 3 && <button className="link" onClick={() => setTab('expenses')}>See all</button>}</div>
            <ExpenseList c={c} limit={3} />
          </Card>
        </div>
      )}
      {tab === 'expenses' && <Card tight><ExpenseList c={c} /></Card>}
      {tab === 'ledger' && <VibeLedger c={c} />}
    </>
  );
}

function ExpenseList({ c, limit }: { c: Circle; limit?: number }) {
  const { state } = useStore();
  const ui = useUI();
  const pairs = buildPairs(c, state.circleExpenses, state.settlements);
  const list = state.circleExpenses.filter((e) => e.circleId === c.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  const m = (n: number) => formatMoney(n, c.currency);
  if (list.length === 0) return <Empty icon={HandCoins} title="No shared expenses yet." text="Record the first one and everyone's share is worked out for you." action={<Button variant="primary" onClick={() => ui.open({ k: 'circleExpense', circleId: c.id })}>Add expense</Button>} />;
  return (
    <div className="divide">{list.map((e) => {
      const mine = e.shares[ME] ?? 0;
      const open = Object.entries(e.shares).some(([pid, sh]) => pid !== e.payerId && sh > 0 && (pairs[e.payerId]?.[pid] ?? 0) > 0);
      return (
        <button key={e.id} className="list-row" onClick={() => ui.open({ k: 'circleExpenseDetail', id: e.id })}>
          <span className="ico-box mint"><HandCoins size={20} /></span>
          <div className="grow"><div className="truncate" style={{ fontWeight: 560 }}>{e.title}</div><div className="small muted truncate">{nameOf(c, e.payerId)} paid · {formatDate(e.date)}</div></div>
          <div className="right num"><div style={{ fontWeight: 600 }}>{m(e.totalMinor)}</div><div className="small muted">{mine ? `Your share ${m(mine)}` : 'Not in split'} · {open ? 'Open' : 'Settled'}</div></div>
        </button>
      );
    })}</div>
  );
}

function VibeLedger({ c }: { c: Circle }) {
  const { state, apply } = useStore();
  const ui = useUI();
  const toast = useToast();
  const [th, setTh] = useState(minorToInput(c.vibeThresholdMinor));
  const [err, setErr] = useState<string | null>(null);
  const m = (n: number) => formatMoney(n, c.currency);
  const pairs = buildPairs(c, state.circleExpenses, state.settlements);
  const myNet = netPositions(c, state.circleExpenses, state.settlements)[ME] ?? 0;
  const others = c.members.filter((x) => x.id !== ME);
  const ready = others.some((o) => vibeStatus(pairs[ME]?.[o.id] ?? 0, c.vibeThresholdMinor) === 'ready');
  const between: { a: string; b: string; amt: number }[] = [];
  for (let i = 0; i < others.length; i++) for (let j = i + 1; j < others.length; j++) {
    const v = pairs[others[i].id]?.[others[j].id] ?? 0;
    if (v !== 0) between.push(v > 0 ? { a: others[i].id, b: others[j].id, amt: v } : { a: others[j].id, b: others[i].id, amt: -v });
  }
  const saveTh = () => {
    const v = parseAmountToMinor(th || '0');
    if (v === null) return setErr('Enter a valid amount.');
    const r = apply((s) => updateCircle(s, c.id, { vibeThresholdMinor: v }));
    r.ok ? (setErr(null), toast('Threshold updated. Balances are unchanged.')) : setErr(r.error);
  };

  return (
    <div className="stack">
      <Card tight>
        <h2>The Vibe Ledger</h2>
        <p className="muted">Keep the small stuff from becoming a big thing.</p>
        <div style={{ fontSize: 22, fontWeight: 650, marginTop: 8 }} className="num">{myNet === 0 ? 'All caught up.' : positionText(myNet, c.currency) + '.'}</div>
      </Card>
      {ready && <Notice tone="mint">Some small balances have added up. Want to settle them together? <button className="link" onClick={() => ui.open({ k: 'settle', circleId: c.id })}>Review balances</button></Notice>}
      <Card tight>
        <div className="card-title"><h3>Running balances with you</h3></div>
        {others.length === 0 ? <Empty icon={Users} title="Just you so far." text="Add a friend to start a running tally." action={<Button size="sm" onClick={() => ui.open({ k: 'members', circleId: c.id })}>Add members</Button>} /> : (
          <div className="divide">{others.map((o) => {
            const b = pairs[ME]?.[o.id] ?? 0;
            const st = vibeStatus(b, c.vibeThresholdMinor);
            return (
              <button key={o.id} className="list-row" onClick={() => ui.open({ k: 'pair', circleId: c.id, otherId: o.id })} aria-label={`Details with ${o.name}`}>
                <Avatar name={o.name} size={36} />
                <div className="grow"><div style={{ fontWeight: 560 }}>{o.name}</div>
                  <div className="small muted">{b > 0 ? `owes you ${m(b)}` : b < 0 ? `you owe ${m(-b)}` : 'all square'}</div></div>
                {st === 'buffered' && <span className="chip mint" title="Counted in your balance, just not worth a payment yet">Buffered</span>}
                {st === 'ready' && <span className="chip warn">Ready to settle</span>}
              </button>
            );
          })}</div>
        )}
        {between.length > 0 && (<><h3 style={{ margin: '14px 0 4px' }}>Between friends</h3><div className="divide small">{between.map((x) => <div key={x.a + x.b} className="list-row"><span className="grow">{nameOf(c, x.a)} is owed by {nameOf(c, x.b)}</span><span className="num">{m(x.amt)}</span></div>)}</div></>)}
        <p className="small muted" style={{ marginTop: 10 }}>Buffered means small enough to wait — it's still counted and nothing is forgiven.</p>
        <div style={{ marginTop: 12 }}><Button onClick={() => ui.open({ k: 'settle', circleId: c.id })}><ArrowLeftRight size={16} /> Simplify settle-up</Button></div>
      </Card>
      <Card tight>
        <h3>Settlement threshold</h3>
        <p className="small muted" style={{ marginBottom: 8 }}>Suggest settling when a balance reaches {m(c.vibeThresholdMinor)}. This controls suggestions only, not the underlying balance.</p>
        <div className="row"><div className="grow"><Field label="Threshold">{(i) => <MoneyInput id={i} value={th} onChange={setTh} currency={c.currency} />}</Field></div><Button style={{ alignSelf: 'flex-end' }} onClick={saveTh}>Save</Button></div>
        {err && <div style={{ marginTop: 8 }}><Notice tone="danger">{err}</Notice></div>}
      </Card>
    </div>
  );
}
