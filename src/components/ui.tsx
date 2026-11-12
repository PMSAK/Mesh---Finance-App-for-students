import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  Bus, CheckCircle2, CircleAlert, CircleEllipsis, Clapperboard, GraduationCap, HeartPulse, Info, Receipt, Repeat,
  ShoppingBag, ShoppingBasket, TriangleAlert, Utensils, X, Zap, Check, Loader2,
} from 'lucide-react';
import { formatMoney, minorToInput } from '../lib/money';

/* ------------------------------- Logo ------------------------------- */
export function Logo({ size = 28, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill={light ? '#fff' : '#176B52'} />
      <g fill="none" stroke={light ? '#176B52' : '#DDF4E8'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 22V12a4 4 0 0 1 8 0v10" />
        <path d="M16 22V12a4 4 0 0 1 8 0v10" />
      </g>
      <circle cx="8" cy="22" r="1.8" fill={light ? '#176B52' : '#DDF4E8'} />
      <circle cx="24" cy="22" r="1.8" fill={light ? '#176B52' : '#DDF4E8'} />
    </svg>
  );
}

/* ------------------------------ Buttons ------------------------------ */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  block?: boolean;
  loading?: boolean;
};
export function Button({ variant = 'secondary', size = 'md', block, loading, children, disabled, className = '', ...rest }: BtnProps) {
  return (
    <button type="button" {...rest} disabled={disabled || loading} className={`btn ${variant} ${size === 'sm' ? 'sm' : ''} ${block ? 'block' : ''} ${className}`}>
      {loading && <Loader2 size={18} className="spin" aria-hidden />}
      {children}
    </button>
  );
}
export function IconButton({ label, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className="icon-btn" {...rest}>
      {children}
    </button>
  );
}

export const Card = ({ children, className = '', tight, style }: { children: ReactNode; className?: string; tight?: boolean; style?: React.CSSProperties }) => (
  <section className={`card ${tight ? 'tight' : ''} ${className}`} style={style}>{children}</section>
);

/* ------------------------------- Fields ------------------------------- */
export function Field({ label, error, hint, children }: { label: string; error?: string | null; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && (
        <span className="err" role="alert">
          <CircleAlert size={15} aria-hidden style={{ marginTop: 2, flex: 'none' }} />
          {error}
        </span>
      )}
    </div>
  );
}

export function MoneyInput({ id, value, onChange, big, currency = 'INR', invalid, autoFocus, 'aria-label': ariaLabel }: {
  id?: string; value: string; onChange: (v: string) => void; big?: boolean; currency?: string; invalid?: boolean; autoFocus?: boolean; 'aria-label'?: string;
}) {
  const sym = formatMoney(0, currency).replace(/[\d.,\s]/g, '') || currency;
  return (
    <div className={`money-wrap ${big ? 'xl' : ''}`}>
      <span aria-hidden>{sym}</span>
      <input
        id={id} className="input num" inputMode="decimal" autoComplete="off" placeholder="0" value={value} autoFocus={autoFocus}
        aria-label={ariaLabel} aria-invalid={invalid || undefined}
        onChange={(e) => { const v = e.target.value; if (/^[\d,]*\.?\d{0,2}$/.test(v)) onChange(v); }}
      />
    </div>
  );
}
export { minorToInput };

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ------------------------------ Avatars ------------------------------ */
const hue = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const cls = hue(name) === 0 ? '' : `alt${hue(name)}`;
  return (
    <span className={`avatar ${cls}`} style={{ width: size, height: size, fontSize: size * 0.38 }} role="img" aria-label={name}>
      {name.trim().slice(0, 1).toUpperCase() || '?'}
    </span>
  );
}
export function AvatarStack({ names, max = 4, size = 28 }: { names: string[]; max?: number; size?: number }) {
  const shown = names.slice(0, max);
  return (
    <span className="avatars">
      {shown.map((n, i) => <Avatar key={n + i} name={n} size={size} />)}
      {names.length > max && <span className="avatar" style={{ width: size, height: size, fontSize: 11, background: 'var(--subtle)', color: 'var(--text-2)' }}>+{names.length - max}</span>}
    </span>
  );
}

/* ------------------------------ Category ------------------------------ */
const CAT_ICON: Record<string, typeof Utensils> = {
  Food: Utensils, Groceries: ShoppingBasket, Transport: Bus, Education: GraduationCap, Shopping: ShoppingBag,
  Entertainment: Clapperboard, Subscriptions: Repeat, Bills: Zap, Health: HeartPulse, Other: CircleEllipsis,
};
export function CategoryIcon({ category, size = 20 }: { category: string; size?: number }) {
  const I = CAT_ICON[category] ?? Receipt;
  return <span className="ico-box"><I size={size} aria-hidden /></span>;
}

/* ------------------------------- Notices ------------------------------- */
export function Notice({ tone, children }: { tone: 'info' | 'warn' | 'danger' | 'success' | 'mint'; children: ReactNode }) {
  const I = tone === 'danger' ? CircleAlert : tone === 'warn' ? TriangleAlert : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`notice ${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <I size={18} aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function Empty({ icon: I, title, text, action }: { icon: typeof Utensils; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <I className="art" aria-hidden strokeWidth={1.6} />
      <h3>{title}</h3>
      <p className="muted" style={{ maxWidth: 320 }}>{text}</p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

export const Skeleton = ({ h = 20, w = '100%' }: { h?: number; w?: number | string }) => <div className="skeleton" style={{ height: h, width: w }} />;

/* -------------------------------- Sheet -------------------------------- */
export function Sheet({ title, onClose, children, footer, wide, step }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean; step?: { current: number; total: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea');
    (first ?? ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,textarea,[href],[tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`sheet ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <div className="sheet-head">
          <h2 id={titleId}>{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        {step && <div className="steps" aria-label={`Step ${step.current} of ${step.total}`}>{Array.from({ length: step.total }, (_, i) => <i key={i} className={i < step.current ? 'on' : ''} />)}</div>}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmSheet({ title, body, confirmLabel, danger, onConfirm, onClose }: {
  title: string; body: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet title={title} onClose={onClose} footer={<>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} style={danger ? { flex: 1 } : undefined}>{confirmLabel}</Button>
    </>}>
      <div className="stack-sm">{body}</div>
    </Sheet>
  );
}

/* -------------------------------- Toasts -------------------------------- */
interface ToastItem { id: number; text: string; tone: 'ok' | 'error' }
const ToastCtx = createContext<(text: string, tone?: 'ok' | 'error') => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-1), { id, text, tone }]); // never stack more than two
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), tone === 'error' ? 6000 : 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone === 'error' ? 'error' : ''}`}>
            {t.tone === 'error' ? <CircleAlert size={18} /> : <Check size={18} />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
