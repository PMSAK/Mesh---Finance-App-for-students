import { CalendarClock, Plus, ScanLine, Settings as Cog, Users, HandCoins, Wallet, Gauge, Sparkles } from 'lucide-react';
import { Avatar, Button, Card, Empty, Notice, useToast } from '../components/ui';
import { RunwayMeter } from '../components/Runway';
import { ActivityRow, CommitmentRow } from '../components/Rows';
import { useFinance } from '../hooks';
import { useStore } from '../store';
import { useUI } from '../ui-context';
import { payCommitment } from '../lib/actions';
import { formatMoney } from '../lib/money';
import { formatDate, relativeTime } from '../lib/dates';
import { positionText } from '../lib/text';

export function Home() {
  const f = useFinance();
  const { state, apply, startDemo, resetAll } = useStore();
  const ui = useUI();
  const toast = useToast();
  const { profile } = state;
  const money = (n: number) => formatMoney(n, f.currency);
  const upcoming = state.commitments.filter((c) => c.status === 'unpaid').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const net = f.group.receivableMinor - f.group.payableMinor;

  const pay = (id: string, title: string) => {
    const r = apply((s) => payCommitment(s, id));
    r.ok ? toast(`${title} marked paid. Your tracked cash and runway updated.`) : toast(r.error, 'error');
  };

  const meter = (
    <RunwayMeter
      r={f.runway} mode={profile.incomeMode} balance={f.cash} buffer={profile.safetyBufferMinor} commitments={f.commitmentsTotal}
      owed={f.group.payableMinor} currency={f.currency} spendSource={f.input.spendSource}
      nextIncomeLabel={profile.nextIncomeDate ? formatDate(profile.nextIncomeDate, f.today) : undefined} onFix={() => ui.open({ k: 'income' })}
    />
  );

  return (
    <>
      {state.isDemo && (
        <div className="demo-banner" role="note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div className="row" style={{ gap: 8 }}>
            <Users size={16} />
            <span>Demo mode — sample hostel finances & friends, stored in this browser.</span>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <button className="link" style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest-deep)', textDecoration: 'underline' }} onClick={() => { startDemo(); toast('Demo data restored to initial state.'); }}>
              Reset demo data
            </button>
            <button className="link" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', textDecoration: 'underline' }} onClick={() => { resetAll(); window.location.hash = '/'; }}>
              Test onboarding
            </button>
          </div>
        </div>
      )}
      <header className="topbar">
        <div>
          <h1>Hey, {profile.name}</h1>
          <p className="muted">Here's where your money stands.</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => ui.open({ k: 'coach' })} style={{ background: 'var(--mint)', borderColor: '#c7e8d7', color: 'var(--forest-deep)', fontWeight: 600 }}>
            <Sparkles size={16} color="var(--forest)" /> Analyse my finances
          </Button>
          <button className="icon-btn" aria-label="Profile and settings" onClick={() => ui_go('/settings')} style={{ width: 44, height: 44 }}>
            <Avatar name={profile.name} size={40} />
          </button>
        </div>
      </header>

      <div className="cols-2">
        <div className="stack">
          {meter}
          <Card>
            <div className="card-title"><h3>Coming up</h3>{upcoming.length > 0 && <button className="link" onClick={() => ui_go('/expenses?tab=upcoming')}>See all</button>}</div>
            {upcoming.length === 0 ? (
              <Empty icon={CalendarClock} title="Nothing coming up." text="Add an upcoming expense to keep your runway realistic." action={<Button size="sm" onClick={() => ui.open({ k: 'commitment' })}><Plus size={16} /> Add upcoming expense</Button>} />
            ) : (
              <div className="divide">{upcoming.slice(0, 4).map((c) => <CommitmentRow key={c.id} c={c} currency={f.currency} today={f.today} onPay={() => pay(c.id, c.title)} onEdit={() => ui.open({ k: 'commitment', id: c.id })} />)}</div>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card>
            <div className="row between">
              <div>
                <div className="label">Cash balance</div>
                <div className="num pop" key={f.cash} style={{ fontSize: 34, fontWeight: 680, letterSpacing: '-0.02em' }}>{money(f.cash)}</div>
                <div className="small muted">Manually tracked · updated {relativeTime(profile.updatedAt)}</div>
              </div>
              <Wallet size={28} color="var(--forest)" aria-hidden />
            </div>
            <div className="row wrap" style={{ marginTop: 14 }}>
              <Button variant="primary" onClick={() => ui.open({ k: 'expense' })}><Plus size={18} /> Add expense</Button>
              <Button onClick={() => ui.open({ k: 'afford' })}><Gauge size={18} /> Can I afford this?</Button>
            </div>
            <div className="row wrap" style={{ marginTop: 8, gap: 4 }}>
              <Button variant="ghost" size="sm" onClick={() => ui.open({ k: 'coach' })} style={{ color: 'var(--forest-deep)', fontWeight: 550 }}><Sparkles size={16} color="var(--forest)" /> Money Coach</Button>
              <Button variant="ghost" size="sm" onClick={() => ui.open({ k: 'receipt' })}><ScanLine size={16} /> Scan receipt</Button>
              <Button variant="ghost" size="sm" onClick={() => ui.open({ k: 'circle' })}><Users size={16} /> Create Circle</Button>
              <Button variant="ghost" size="sm" onClick={() => ui.open({ k: 'income' })}><Cog size={16} /> Update allowance</Button>
            </div>
          </Card>

          <Card>
            <div className="card-title"><h3>Money with friends</h3><button className="link" onClick={() => ui_go('/circles')}>View debts</button></div>
            {state.circles.length === 0 ? (
              <div className="stack-sm">
                <p className="muted">No Circles yet. Create a Circle to split costs and track debts with friends.</p>
                <div>
                  <Button size="sm" variant="secondary" onClick={() => ui.open({ k: 'circle' })}>
                    <Plus size={16} /> Create a Circle
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="row"><span className="ico-box mint"><HandCoins size={20} /></span>
                  <div><strong>{positionText(net, f.currency)}</strong>
                    <div className="small muted">{f.group.receivableMinor > 0 && `${money(f.group.receivableMinor)} owed to you (not cash yet). `}{f.group.payableMinor > 0 && `${money(f.group.payableMinor)} you owe, reserved in your runway.`}{net === 0 && f.group.receivableMinor === 0 && 'Everyone is square.'}</div>
                  </div>
                </div>
                {f.group.receivableMinor > 0 && <Notice tone="info">Money friends owe you isn't counted in your cash or daily limit until it's actually settled.</Notice>}
              </>
            )}
          </Card>

          <Card>
            <div className="card-title"><h3>Recent activity</h3>{state.events.length > 0 && <button className="link" onClick={() => ui_go('/activity')}>See all</button>}</div>
            {state.events.length === 0 ? <p className="muted">Your activity will show up here once you add an expense.</p> : <div className="divide">{state.events.slice(0, 5).map((e) => <ActivityRow key={e.id} e={e} currency={f.currency} />)}</div>}
          </Card>
        </div>
      </div>
    </>
  );
}

function ui_go(p: string) { window.location.hash = p; }
