import { useMemo, useState } from 'react';
import { Activity as ActivityIcon, House, Plus, ReceiptText, Settings as Cog, UsersRound } from 'lucide-react';
import { Avatar, Logo, ToastProvider } from './components/ui';
import { StoreProvider, useStore } from './store';
import { UICtx, useHashRoute, type SheetSpec } from './ui-context';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Expenses } from './pages/Expenses';
import { Circles, CircleDetail } from './pages/Circles';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { AddExpenseSheet, AffordSheet, CommitmentSheet, ExpenseDetailSheet, IncomeSheet } from './sheets/PersonalSheets';
import { CircleExpenseDetailSheet, CreateCircleSheet, MembersSheet, PairSheet, SettleSheet } from './sheets/CircleSheets';
import { GroupExpenseFlow } from './sheets/GroupExpenseFlow';
import { ReceiptSheet } from './sheets/ReceiptSheet';
import { CoachSheet } from './sheets/CoachSheet';

const NAV = [
  { to: '/', label: 'Home', Icon: House },
  { to: '/expenses', label: 'Expenses', Icon: ReceiptText },
  { to: '/circles', label: 'Circles', Icon: UsersRound },
  { to: '/activity', label: 'Activity', Icon: ActivityIcon },
] as const;

function Shell() {
  const { state } = useStore();
  const { path: raw, go } = useHashRoute();
  const [sheet, setSheet] = useState<SheetSpec | null>(null);
  const [rawPath, query] = raw.split('?');
  const parts = rawPath.split('/').filter(Boolean);
  const section = parts[0] ?? '';
  const ctx = useMemo(() => ({ open: setSheet, close: () => setSheet(null), go, path: rawPath }), [go, rawPath]);

  if (!state.onboarded) return <Onboarding />;

  const close = () => setSheet(null);
  const isActive = (to: string) => (to === '/' ? section === '' : section === to.slice(1));
  const showFab = section === '' || section === 'expenses' || section === 'activity';

  let page;
  if (section === 'expenses') page = <Expenses key={query} tab={new URLSearchParams(query).get('tab') === 'upcoming' ? 'upcoming' : 'transactions'} />;
  else if (section === 'circles') page = parts[1] ? <CircleDetail key={parts[1]} id={parts[1]} /> : <Circles />;
  else if (section === 'activity') page = <Activity />;
  else if (section === 'settings') page = <Settings />;
  else page = <Home />;

  const circleFor = (id: string) => state.circles.find((c) => c.id === id);

  return (
    <UICtx.Provider value={ctx}>
      <div className="shell">
        <nav className="sidebar" aria-label="Main">
          <div className="brand"><Logo /> Mesh</div>
          {NAV.map(({ to, label, Icon }) => (
            <a key={to} href={`#${to}`} className="side-link" aria-current={isActive(to) ? 'page' : undefined}><Icon size={20} /> {label}</a>
          ))}
          <div style={{ flex: 1 }} />
          <a href="#/settings" className="side-link" aria-current={section === 'settings' ? 'page' : undefined}><Cog size={20} /> Settings</a>
          <div className="row" style={{ padding: '12px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
            <Avatar name={state.profile.name} size={34} />
            <div className="grow"><div className="truncate" style={{ fontWeight: 560 }}>{state.profile.name}</div><div className="small muted">{state.isDemo ? 'Demo data' : 'Local profile'}</div></div>
          </div>
        </nav>

        <main className="main"><div className="inner">{page}</div></main>

        {showFab && <button className="fab" onClick={() => setSheet({ k: 'expense' })} aria-label="Add expense"><Plus size={22} /> <span>Add expense</span></button>}

        <nav className="bottom-nav" aria-label="Main">
          {NAV.map(({ to, label, Icon }) => (
            <a key={to} href={`#${to}`} className="nav-item" aria-current={isActive(to) ? 'page' : undefined}><span className="nav-ico"><Icon size={21} /></span>{label}</a>
          ))}
        </nav>

        {sheet?.k === 'expense' && <AddExpenseSheet circleId={sheet.circleId} onClose={close} />}
        {sheet?.k === 'expenseDetail' && <ExpenseDetailSheet id={sheet.id} onClose={close} />}
        {sheet?.k === 'commitment' && <CommitmentSheet id={sheet.id} onClose={close} />}
        {sheet?.k === 'afford' && <AffordSheet onClose={close} />}
        {sheet?.k === 'income' && <IncomeSheet onClose={close} />}
        {sheet?.k === 'circleExpense' && circleFor(sheet.circleId) && (
          <GroupExpenseFlow key={sheet.editId ?? JSON.stringify(sheet.prefill ?? {}) + sheet.circleId} circle={circleFor(sheet.circleId)!} editId={sheet.editId} prefill={sheet.prefill} onClose={close} />
        )}
        {sheet?.k === 'receipt' && <ReceiptSheet circleId={sheet.circleId} onClose={close} />}
        {sheet?.k === 'circle' && <CreateCircleSheet onClose={close} />}
        {sheet?.k === 'settle' && <SettleSheet circleId={sheet.circleId} onClose={close} />}
        {sheet?.k === 'circleExpenseDetail' && <CircleExpenseDetailSheet id={sheet.id} onClose={close} />}
        {sheet?.k === 'members' && <MembersSheet circleId={sheet.circleId} onClose={close} />}
        {sheet?.k === 'pair' && <PairSheet circleId={sheet.circleId} otherId={sheet.otherId} onClose={close} />}
        {sheet?.k === 'coach' && <CoachSheet onClose={close} />}
      </div>
    </UICtx.Provider>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}


