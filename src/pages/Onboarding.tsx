import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Users, Wallet, CalendarClock, Sparkles } from 'lucide-react';
import { Button, Card, Field, Logo, MoneyInput, Notice } from '../components/ui';
import { Breakdown } from '../components/Runway';
import { useStore } from '../store';
import { completeOnboarding, emptyProfile } from '../lib/actions';
import { computeRunway } from '../lib/runway';
import { formatMoney, parseAmountToMinor } from '../lib/money';
import { addDays, formatDate, todayStr } from '../lib/dates';
import { CATEGORIES, type IncomeMode } from '../lib/types';

interface Draft { id: string; title: string; amount: string; dueDate: string; category: string }

export function Onboarding() {
  const { apply, startDemo } = useStore();
  const today = todayStr();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [mode, setMode] = useState<IncomeMode>('ExactDate');
  const [date, setDate] = useState(addDays(today, 14));
  const [days, setDays] = useState('14');
  const [buffer, setBuffer] = useState('');
  const [est, setEst] = useState('');
  const [items, setItems] = useState<Draft[]>([]);
  const [d, setD] = useState<Draft>({ id: '', title: '', amount: '', dueDate: addDays(today, 7), category: 'Bills' });
  const [err, setErr] = useState<string | null>(null);

  const balanceMinor = parseAmountToMinor(balance || '0');
  const bufferMinor = parseAmountToMinor(buffer || '0') ?? 0;
  const estMinor = parseAmountToMinor(est || '0') ?? 0;
  const commitmentsMinor = items.reduce((a, i) => a + (parseAmountToMinor(i.amount) ?? 0), 0);
  const daysNum = Number(days);

  const runway = useMemo(() => computeRunway({
    balanceMinor: balanceMinor ?? 0, commitmentsMinor, owedToFriendsMinor: 0, bufferMinor, mode,
    nextIncomeDate: mode === 'ExactDate' ? date : null, targetDays: mode === 'TargetDays' ? daysNum : null,
    trailingDailySpendMinor: estMinor, today,
  }), [balanceMinor, commitmentsMinor, bufferMinor, mode, date, daysNum, estMinor, today]);

  const next = () => {
    setErr(null);
    if (step === 1) {
      if (!name.trim()) return setErr('Tell us what to call you.');
      if (balanceMinor === null) return setErr('Enter a valid amount (up to 2 decimals).');
    }
    if (step === 2) {
      if (mode === 'ExactDate' && !date) return setErr('Pick the date your money comes in.');
      if (mode === 'TargetDays' && (!Number.isInteger(daysNum) || daysNum <= 0)) return setErr('Enter a whole number of days above zero.');
      if (parseAmountToMinor(buffer || '0') === null || parseAmountToMinor(est || '0') === null) return setErr('Check the buffer and spending amounts.');
    }
    setStep(step + 1);
  };

  const addItem = () => {
    const amt = parseAmountToMinor(d.amount);
    if (!d.title.trim() || !amt || amt <= 0) return setErr('Give it a name and an amount above zero.');
    setErr(null);
    setItems([...items, { ...d, id: crypto.randomUUID() }]);
    setD({ ...d, title: '', amount: '' });
  };

  const finish = () => {
    const p = { ...emptyProfile(), name: name.trim(), openingBalanceMinor: balanceMinor ?? 0, incomeMode: mode, nextIncomeDate: mode === 'ExactDate' ? date : null, targetDays: mode === 'TargetDays' ? daysNum : null, estimatedDailySpendMinor: estMinor, safetyBufferMinor: bufferMinor };
    const r = apply((s) => completeOnboarding(s, p, items.map((i) => ({ title: i.title, amountMinor: parseAmountToMinor(i.amount) ?? 0, dueDate: i.dueDate, category: i.category }))));
    if (!r.ok) setErr(r.error);
  };

  return (
    <div className="onb">
      <div className="row between">
        <div className="row" style={{ gap: 10 }}><Logo /><strong style={{ fontSize: 20, letterSpacing: '-0.02em' }}>Mesh</strong></div>
        {step > 0 && <Button variant="ghost" size="sm" onClick={() => { setErr(null); setStep(step - 1); }}><ArrowLeft size={16} /> Back</Button>}
      </div>
      {step > 0 && <div className="steps" style={{ padding: '16px 0 0' }} aria-label={`Step ${step} of 4`}>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>}

      <div className="body">
        {step === 0 && (
          <>
            <svg className="hero-art" width="132" height="96" viewBox="0 0 132 96" aria-hidden="true">
              <circle cx="40" cy="48" r="30" fill="#DDF4E8" /><circle cx="92" cy="48" r="30" fill="#176B52" opacity=".9" />
              <path d="M40 48a30 30 0 0 1 26 15 30 30 0 0 1-26 15 30 30 0 0 1 0-30z" fill="#104A3A" opacity=".0" />
              <circle cx="66" cy="48" r="9" fill="#fff" /><circle cx="66" cy="48" r="4" fill="#176B52" />
            </svg>
            <div className="stack-sm">
              <h1>Your money, minus the stress.</h1>
              <p className="muted" style={{ fontSize: 16 }}>Know your spending runway, split bills with friends and keep small debts from becoming a big deal.</p>
            </div>
            <div className="stack-sm">
              <Button variant="primary" block onClick={() => setStep(1)}>Get started</Button>
              <Button block onClick={startDemo}><Sparkles size={18} /> Explore demo</Button>
              <p className="hint" style={{ textAlign: 'center' }}>The demo loads clearly-labelled sample data. Everything stays in this browser.</p>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1>How much money do you have right now?</h1>
            <Field label="What should we call you?">{(id) => <input id={id} className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="given-name" maxLength={40} />}</Field>
            <Field label="Current cash balance" hint="The cash you want Mesh to track — not necessarily a live bank balance. Currency: INR (₹).">
              {(id) => <MoneyInput id={id} big value={balance} onChange={setBalance} invalid={balanceMinor === null} />}
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <h1>When does your money come in?</h1>
            <div className="stack-sm">
              <button className="opt" aria-pressed={mode === 'ExactDate'} onClick={() => setMode('ExactDate')}><CalendarClock size={20} /> I know the date</button>
              <button className="opt" aria-pressed={mode === 'TargetDays'} onClick={() => setMode('TargetDays')}><Wallet size={20} /> Give me a number of days to budget for</button>
              <button className="opt" aria-pressed={mode === 'Unknown'} onClick={() => setMode('Unknown')}><Users size={20} /> I'm not sure yet</button>
            </div>
            {mode === 'ExactDate' && <Field label="Next allowance date">{(id) => <input id={id} type="date" className="input" value={date} min={today} onChange={(e) => setDate(e.target.value)} />}</Field>}
            {mode === 'TargetDays' && <Field label="Days to budget for">{(id) => <input id={id} className="input" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} />}</Field>}
            {mode === 'Unknown' && <Notice tone="info">We'll estimate your runway from your spending. Add a rough daily spend below or record expenses as you go.</Notice>}
            <div className="summary-grid">
              <Field label="Safety buffer (optional)" hint="Money you'd rather not touch.">{(id) => <MoneyInput id={id} value={buffer} onChange={setBuffer} />}</Field>
              <Field label="Daily spend estimate (optional)" hint="An estimate — labelled as such.">{(id) => <MoneyInput id={id} value={est} onChange={setEst} />}</Field>
            </div>
            <p className="hint">Estimates adjust as you record real spending.</p>
          </>
        )}

        {step === 3 && (
          <>
            <h1>Anything important coming up?</h1>
            <p className="muted">Hostel fees, travel, bills — we'll set that money aside so your daily limit stays realistic. You can skip this.</p>
            {items.length > 0 && (
              <Card tight><div className="divide">{items.map((i) => (
                <div className="list-row" key={i.id}>
                  <div className="grow"><strong>{i.title}</strong><div className="small muted">{i.category} · {formatDate(i.dueDate)}</div></div>
                  <span className="num">{formatMoney(parseAmountToMinor(i.amount) ?? 0)}</span>
                  <button className="icon-btn" aria-label={`Remove ${i.title}`} onClick={() => setItems(items.filter((x) => x.id !== i.id))}><Trash2 size={18} /></button>
                </div>))}</div></Card>
            )}
            <div className="stack-sm">
              <Field label="What is it?">{(id) => <input id={id} className="input" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="e.g. Hostel mess fee" maxLength={60} />}</Field>
              <div className="summary-grid">
                <Field label="Amount">{(id) => <MoneyInput id={id} value={d.amount} onChange={(v) => setD({ ...d, amount: v })} />}</Field>
                <Field label="Due date">{(id) => <input id={id} type="date" className="input" value={d.dueDate} onChange={(e) => setD({ ...d, dueDate: e.target.value })} />}</Field>
              </div>
              <Field label="Category">{(id) => <select id={id} className="input" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>}</Field>
              <Button onClick={addItem}><Plus size={18} /> Add to list</Button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="stack-sm">
              <h1>Here's a starting point.</h1>
              <p className="muted">Based on what you've told us. It's an estimate, not a guarantee — it updates as you spend.</p>
            </div>
            <div className="runway">
              <div className="eyebrow" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>{runway.dailyLimitMinor !== null ? 'DAILY SPENDING LIMIT' : 'ESTIMATED RUNWAY'}</div>
              <div className="big num">
                {runway.dailyLimitMinor !== null ? `${formatMoney(runway.dailyLimitMinor)}/day` : runway.estimatedDaysLeft !== null ? `~${runway.estimatedDaysLeft} days` : '—'}
              </div>
              {runway.error && <p className="sub">{runway.error}</p>}
              <Breakdown r={runway} balance={balanceMinor ?? 0} buffer={bufferMinor} currency="INR" commitments={commitmentsMinor} />
            </div>
            {runway.status !== 'comfortable' && runway.reasons.length > 0 && <Notice tone="warn">{runway.reasons.join(' ')}</Notice>}
          </>
        )}

        {err && <Notice tone="danger">{err}</Notice>}
        {step >= 1 && step < 4 && (
          <div className="stack-sm">
            <Button variant="primary" block onClick={next}>{step === 3 && items.length === 0 ? 'Skip for now' : 'Continue'}</Button>
          </div>
        )}
        {step === 4 && <Button variant="primary" block onClick={finish}>Go to my dashboard</Button>}
      </div>
    </div>
  );
}
