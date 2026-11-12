import { useEffect, useRef, useState } from 'react';
import { CalendarClock, CheckCircle2, Gauge, RefreshCw, Sparkles, TrendingUp, Users, Wallet } from 'lucide-react';
import { Button, Card, Notice, Sheet } from '../components/ui';
import { useFinance } from '../hooks';
import { useStore } from '../store';
import { coachStatus, requestCoachAnalysis, CoachError, type CoachAnalysis } from '../api';
import { formatMoney } from '../lib/money';

const CATEGORY_ICONS = {
  spending: Wallet,
  runway: Gauge,
  commitments: CalendarClock,
  shared: Users,
} as const;

const VERDICT_BADGE = {
  comfortable: { label: 'Comfortable', chipClass: 'success' },
  caution: { label: 'Keep an eye on it', chipClass: 'warn' },
  at_risk: { label: 'At Risk', chipClass: 'danger' },
} as const;

export function CoachSheet({ onClose }: { onClose: () => void }) {
  const f = useFinance();
  const { state } = useStore();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ message: string; code?: string } | null>(null);
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => {
    coachStatus().then(setConfigured);
  }, []);

  const runAnalysis = async () => {
    setBusy(true);
    setErr(null);
    ctl.current?.abort();
    ctl.current = new AbortController();

    const payload = {
      studentName: state.profile.name || 'Student',
      currency: f.currency,
      trackedCashPaise: f.cash,
      runway: {
        flexiblePaise: f.runway.flexibleMinor,
        reservedPaise: f.runway.reservedMinor,
        dailyLimitPaise: f.runway.dailyLimitMinor,
        daysRemaining: f.runway.daysRemaining,
        status: f.runway.status,
        reasons: f.runway.reasons,
        explanation: f.runway.explanation,
      },
      safetyBufferPaise: state.profile.safetyBufferMinor,
      upcomingCommitments: state.commitments
        .filter((c) => c.status === 'unpaid')
        .map((c) => ({
          title: c.title,
          amountPaise: c.amountMinor,
          dueDate: c.dueDate,
          category: c.category,
          status: c.status,
        })),
      moneyWithFriends: {
        receivablePaise: f.group.receivableMinor,
        payablePaise: f.group.payableMinor,
        circlesCount: state.circles.length,
      },
      recentExpenses: state.expenses.slice(0, 15).map((e) => ({
        title: e.title,
        amountPaise: e.amountMinor,
        category: e.category,
        date: e.date,
      })),
      trailingDailySpendPaise: f.input.trailingDailySpendMinor,
      today: f.today,
    };

    try {
      const res = await requestCoachAnalysis(payload, ctl.current.signal);
      setAnalysis(res);
    } catch (e) {
      if (e instanceof CoachError && e.code === 'cancelled') return;
      const msg = e instanceof Error ? e.message : 'Something went wrong connecting to OpenAI.';
      const code = e instanceof CoachError ? e.code : 'error';
      setErr({ message: msg, code });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    runAnalysis();
    return () => {
      ctl.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badge = analysis ? VERDICT_BADGE[analysis.verdict] || VERDICT_BADGE.comfortable : null;

  return (
    <Sheet
      wide
      title="Money Coach"
      onClose={() => {
        ctl.current?.abort();
        onClose();
      }}
      footer={
        <div className="row between" style={{ width: '100%' }}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" loading={busy} onClick={runAnalysis}>
            <RefreshCw size={16} /> {busy ? 'Analyzing…' : 'Refresh analysis'}
          </Button>
        </div>
      }
    >
      <div className="stack">
        <div className="row between wrap">
          <div className="row" style={{ gap: 8 }}>
            <span className="ico-box mint" style={{ width: 36, height: 36 }}>
              <Sparkles size={18} />
            </span>
            <div>
              <strong style={{ fontSize: 16 }}>AI Financial Assessment</strong>
              <div className="small muted">Powered by OpenAI (server-side)</div>
            </div>
          </div>
          {badge && <span className={`chip ${badge.chipClass}`}>{badge.label}</span>}
        </div>

        {configured === false && (
          <Notice tone="warn">
            <strong>OpenAI API key missing:</strong> To generate live AI recommendations, ensure <code>OPENAI_API_KEY</code> is set in <code>.env</code> or <code>.env.local</code>.
          </Notice>
        )}

        {err && (
          <Notice tone="danger">
            <div>
              <strong>Analysis issue:</strong> {err.message}
              <div style={{ marginTop: 8 }}>
                <Button size="sm" onClick={runAnalysis}>
                  Try again
                </Button>
              </div>
            </div>
          </Notice>
        )}

        {busy && (
          <div className="stack" style={{ padding: '16px 0' }}>
            <Notice tone="mint">
              <span className="spin" style={{ display: 'inline-block', marginRight: 6 }}>
                ✦
              </span>
              Analyzing your cash ({formatMoney(f.cash, f.currency)}), {f.runway.daysRemaining ?? '14'} planning days, commitments, and friend tallies...
            </Notice>
            <div className="skeleton" style={{ height: 80, width: '100%' }} />
            <div className="skeleton" style={{ height: 100, width: '100%' }} />
            <div className="skeleton" style={{ height: 100, width: '100%' }} />
          </div>
        )}

        {!busy && analysis && (
          <div className="stack">
            <Card tight style={{ background: '#f4fbf7', borderColor: '#b8dfcb' }}>
              <div className="stack-sm">
                <span className="label" style={{ color: 'var(--forest-deep)' }}>
                  COACH OVERVIEW
                </span>
                <p style={{ fontSize: 15, lineHeight: 1.45, fontWeight: 500, color: 'var(--forest-deep)' }}>
                  “{analysis.summary}”
                </p>
              </div>
            </Card>

            <div>
              <h3 style={{ marginBottom: 10 }}>Personalized Recommendations ({analysis.recommendations.length})</h3>
              <div className="stack-sm">
                {analysis.recommendations.map((rec) => {
                  const Icon = CATEGORY_ICONS[rec.category] || TrendingUp;
                  return (
                    <Card tight key={rec.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="row between wrap">
                        <div className="row" style={{ gap: 8 }}>
                          <span className="ico-box" style={{ width: 28, height: 28, borderRadius: 8 }}>
                            <Icon size={15} />
                          </span>
                          <strong style={{ fontSize: 14 }}>{rec.title}</strong>
                        </div>
                        <span className="chip" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                          {rec.category}
                        </span>
                      </div>
                      <p className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                        {rec.advice}
                      </p>
                      {rec.impact && (
                        <div className="row" style={{ gap: 6, marginTop: 2 }}>
                          <CheckCircle2 size={14} color="var(--forest)" />
                          <span className="small" style={{ color: 'var(--forest-deep)', fontWeight: 550 }}>
                            {rec.impact}
                          </span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            <p className="small muted" style={{ textAlign: 'center', marginTop: 4 }}>
              Recommendations are grounded strictly in your tracked entries. Balances & limits are computed by Mesh.
            </p>
          </div>
        )}
      </div>
    </Sheet>
  );
}
