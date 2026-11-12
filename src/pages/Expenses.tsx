import { useMemo, useState } from 'react';
import { CalendarClock, Plus, Receipt, Search } from 'lucide-react';
import { Button, Card, CategoryIcon, Empty, Segmented, useToast } from '../components/ui';
import { CommitmentRow } from '../components/Rows';
import { useFinance } from '../hooks';
import { useStore } from '../store';
import { useUI } from '../ui-context';
import { payCommitment } from '../lib/actions';
import { formatMoney } from '../lib/money';
import { addDays, formatDate } from '../lib/dates';
import { CATEGORIES, ME } from '../lib/types';

type Row = { key: string; kind: 'personal' | 'circle'; id: string; title: string; sub: string; date: string; category: string; amount: number; note?: string; searchable: string };

export function Expenses({ tab: initial }: { tab: 'transactions' | 'upcoming' }) {
  const f = useFinance();
  const { state, apply } = useStore();
  const ui = useUI();
  const toast = useToast();
  const [tab, setTab] = useState<'transactions' | 'upcoming'>(initial);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [range, setRange] = useState('all');
  const money = (n: number) => formatMoney(n, f.currency);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = state.expenses.map((e) => ({
      key: e.id, kind: 'personal', id: e.id, title: e.title, sub: e.category, date: e.date, category: e.category, amount: e.amountMinor, searchable: `${e.title} ${e.category} ${e.notes}`.toLowerCase(),
    }));
    for (const e of state.circleExpenses) {
      const share = e.shares[ME] ?? 0;
      if (e.payerId !== ME && share === 0) continue;
      const c = state.circles.find((x) => x.id === e.circleId);
      const payer = c?.members.find((m) => m.id === e.payerId)?.name ?? 'Someone';
      out.push({
        key: e.id, kind: 'circle', id: e.id, title: e.title, date: e.date, category: 'Shared', searchable: `${e.title} ${c?.name ?? ''}`.toLowerCase(),
        sub: `${c?.name ?? 'Circle'} · ${e.payerId === ME ? 'You paid' : `${payer} paid`}`,
        amount: e.payerId === ME ? e.totalMinor : 0,
        note: e.payerId === ME ? (share ? `Your share ${money(share)}` : 'Not in the split') : `Your share ${money(share)} · owed, not paid`,
      });
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.expenses, state.circleExpenses, state.circles]);

  const from = range === '7' ? addDays(f.today, -6) : range === '30' ? addDays(f.today, -29) : range === 'month' ? f.today.slice(0, 8) + '01' : '';
  const shown = rows.filter((r) => (!q || r.searchable.includes(q.toLowerCase())) && (cat === 'All' || r.category === cat) && (!from || r.date >= from));
  const upcoming = [...state.commitments].sort((a, b) => (a.status === b.status ? a.dueDate.localeCompare(b.dueDate) : a.status === 'unpaid' ? -1 : 1));

  const pay = (id: string, title: string) => {
    const r = apply((s) => payCommitment(s, id));
    r.ok ? toast(`${title} marked paid.`) : toast(r.error, 'error');
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Expenses</h1><p>Keep track of where your money goes.</p></div>
        <Button variant="primary" onClick={() => (tab === 'upcoming' ? ui.open({ k: 'commitment' }) : ui.open({ k: 'expense' }))}><Plus size={18} /> {tab === 'upcoming' ? 'Add upcoming' : 'Add expense'}</Button>
      </div>
      <div className="stack">
        <Segmented label="Expense view" value={tab} onChange={setTab} options={[{ value: 'transactions', label: 'Transactions' }, { value: 'upcoming', label: 'Coming up' }]} />

        {tab === 'transactions' ? (
          <Card tight>
            <div className="row wrap" style={{ marginBottom: 12 }}>
              <div className="money-wrap grow" style={{ minWidth: 180 }}>
                <span aria-hidden><Search size={16} /></span>
                <input className="input" aria-label="Search expenses" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className="input" style={{ width: 'auto' }} aria-label="Filter by category" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option>All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}<option>Shared</option>
              </select>
              <select className="input" style={{ width: 'auto' }} aria-label="Filter by date" value={range} onChange={(e) => setRange(e.target.value)}>
                <option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="month">This month</option>
              </select>
            </div>
            {rows.length === 0 ? (
              <Empty icon={Receipt} title="Your spending story starts here." text="Add your first expense to start seeing where your money goes." action={<Button variant="primary" onClick={() => ui.open({ k: 'expense' })}>Add your first expense</Button>} />
            ) : shown.length === 0 ? (
              <Empty icon={Search} title="No matches." text="Try a different search or clear the filters." action={<Button size="sm" onClick={() => { setQ(''); setCat('All'); setRange('all'); }}>Clear filters</Button>} />
            ) : (
              <div className="divide">
                {shown.map((r) => (
                  <button key={r.key} className="list-row" onClick={() => ui.open(r.kind === 'personal' ? { k: 'expenseDetail', id: r.id } : { k: 'circleExpenseDetail', id: r.id })}>
                    <CategoryIcon category={r.category} />
                    <div className="grow">
                      <div className="truncate" style={{ fontWeight: 560 }}>{r.title}</div>
                      <div className="small muted truncate">{r.sub} · {formatDate(r.date, f.today)}</div>
                    </div>
                    <div className="right">
                      <div className="num" style={{ fontWeight: 600 }}>{r.amount ? `−${money(r.amount)}` : '—'}</div>
                      <div className="small muted">{r.note ?? 'Paid from cash'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Card tight>
            {upcoming.length === 0 ? (
              <Empty icon={CalendarClock} title="Nothing coming up." text="Add an upcoming expense to keep your runway realistic." action={<Button variant="primary" onClick={() => ui.open({ k: 'commitment' })}>Add upcoming expense</Button>} />
            ) : (
              <div className="divide">{upcoming.map((c) => <CommitmentRow key={c.id} c={c} currency={f.currency} today={f.today} onPay={() => pay(c.id, c.title)} onEdit={c.status === 'unpaid' ? () => ui.open({ k: 'commitment', id: c.id }) : undefined} />)}</div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
