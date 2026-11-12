import { useState } from 'react';
import { ChevronDown, ChevronUp, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react';
import type { RunwayResult } from '../lib/runway';
import { formatMoney } from '../lib/money';
import type { IncomeMode } from '../lib/types';

const STATUS = {
  comfortable: { label: 'Comfortable', Icon: CircleCheck },
  caution: { label: 'Keep an eye on it', Icon: TriangleAlert },
  at_risk: { label: 'At risk', Icon: CircleAlert },
} as const;

export function Breakdown({ r, balance, buffer, currency, owed = 0, commitments }: {
  r: RunwayResult; balance: number; buffer: number; currency: string; owed?: number; commitments: number;
}) {
  const f = (n: number) => formatMoney(n, currency);
  return (
    <div className="breakdown num" aria-label="Runway breakdown">
      <div className="line"><span>Tracked cash</span><span>{f(balance)}</span></div>
      <div className="line"><span>− Unpaid commitments</span><span>{f(commitments)}</span></div>
      {owed > 0 && <div className="line"><span>− Owed to friends</span><span>{f(owed)}</span></div>}
      <div className="line"><span>− Safety buffer</span><span>{f(buffer)}</span></div>
      <div className="line total"><span>Flexible balance</span><span>{f(r.flexibleMinor)}</span></div>
      {r.dailyLimitMinor !== null && r.daysRemaining !== null && (
        <div className="line"><span>÷ {r.daysRemaining} day{r.daysRemaining === 1 ? '' : 's'}</span><span>{f(r.dailyLimitMinor)}/day</span></div>
      )}
      {r.estimatedDaysLeft !== null && <div className="line"><span>≈ days of runway</span><span>{r.estimatedDaysLeft}</span></div>}
      <p className="small" style={{ opacity: 0.8, marginTop: 6 }}>{r.explanation} Forecasts depend on the numbers you enter.</p>
    </div>
  );
}

export function RunwayMeter({ r, mode, balance, buffer, commitments, owed, currency, spendSource, nextIncomeLabel, defaultOpen = false, onFix }: {
  r: RunwayResult; mode: IncomeMode; balance: number; buffer: number; commitments: number; owed: number; currency: string;
  spendSource: 'measured' | 'estimate' | 'none'; nextIncomeLabel?: string; defaultOpen?: boolean; onFix?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const f = (n: number) => formatMoney(n, currency);
  const { Icon, label } = STATUS[r.status];
  const total = Math.max(balance, 1);
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / total) * 100))}%`;
  const reserved = Math.min(r.reservedMinor, Math.max(balance, 0));
  const buf = Math.min(buffer, Math.max(balance - reserved, 0));

  let big: string; let sub: string;
  if (r.dailyLimitMinor !== null) { big = `${f(r.dailyLimitMinor)}/day`; sub = 'Based on your next allowance and upcoming essentials.'; }
  else if (r.estimatedDaysLeft !== null) { big = `~${r.estimatedDaysLeft} days`; sub = `Estimated from your ${spendSource === 'measured' ? 'recent spending' : 'spending estimate (not measured)'}.`; }
  else { big = '—'; sub = r.error ?? ''; }

  return (
    <section className="runway" aria-label="Student Runway Meter">
      <div className="row between wrap">
        <span className="eyebrow">{r.dailyLimitMinor !== null || r.error ? 'DAILY SPENDING LIMIT' : 'ESTIMATED RUNWAY'}</span>
        <span className={`status ${r.status}`}><Icon size={14} aria-hidden /> {label}</span>
      </div>
      <div className="big num pop" key={big} aria-live="polite">{big}</div>
      <p className="sub">{sub}</p>
      {r.error && onFix && <button className="link" style={{ color: 'var(--forest-deep)', textDecoration: 'underline' }} onClick={onFix}>Update allowance details</button>}

      <div className="bar" role="img" aria-label={`Of ${f(balance)}: ${f(r.flexibleMinor)} flexible, ${f(reserved)} reserved, ${f(buf)} buffer`}>
        <span className="seg-flex" style={{ width: pct(r.flexibleMinor) }} />
        <span className="seg-res" style={{ width: pct(reserved) }} />
        <span className="seg-buf" style={{ width: pct(buf) }} />
      </div>
      <div className="legend num">
        <span><i style={{ background: 'var(--forest)' }} />Flexible {f(r.flexibleMinor)}</span>
        <span><i style={{ background: '#7fbfa3' }} />Reserved {f(r.reservedMinor)}</span>
        <span><i style={{ background: '#b8dfcb' }} />Buffer {f(buffer)}</span>
      </div>

      <div className="row between wrap" style={{ marginTop: 16 }}>
        <span className="small">
          {mode === 'ExactDate' && r.daysRemaining !== null && `${r.daysRemaining} day${r.daysRemaining === 1 ? '' : 's'} until ${nextIncomeLabel ?? 'your allowance'}`}
          {mode === 'TargetDays' && r.daysRemaining !== null && `Budgeting for ${r.daysRemaining} days`}
          {mode === 'Unknown' && 'Allowance date unknown'}
        </span>
        <button className="link" style={{ color: 'var(--forest-deep)' }} aria-expanded={open} onClick={() => setOpen(!open)}>
          View breakdown {open ? <ChevronUp size={14} style={{ verticalAlign: -2 }} /> : <ChevronDown size={14} style={{ verticalAlign: -2 }} />}
        </button>
      </div>
      {r.reasons.length > 0 && <p className="small" style={{ marginTop: 8 }}>Why: {r.reasons.join(' ')} <span style={{ opacity: 0.7 }}>(simple rules of thumb, not a guarantee)</span></p>}
      {open && <Breakdown r={r} balance={balance} buffer={buffer} currency={currency} owed={owed} commitments={commitments} />}
    </section>
  );
}
