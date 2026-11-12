import { useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, ScanLine, Sparkles } from 'lucide-react';
import { Button, Field, Notice, Sheet } from '../components/ui';
import { useStore } from '../store';
import { useUI, type Prefill } from '../ui-context';
import { scanReceipt, scanStatus, ScanError } from '../api';
import { uid } from '../lib/actions';
import { formatMoney } from '../lib/money';
import { todayStr, isValidDate } from '../lib/dates';
import type { ReceiptItem } from '../lib/types';

export function ReceiptSheet({ circleId, onClose }: { circleId?: string; onClose: () => void }) {
  const { state } = useStore();
  const ui = useUI();
  const [circle, setCircle] = useState(circleId ?? state.circles[0]?.id ?? '');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => { scanStatus().then(setConfigured); }, []);
  useEffect(() => () => { ctl.current?.abort(); if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (f: File | undefined) => {
    setErr(null);
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type)) return setErr('Use a JPG, PNG, WebP or HEIC image.');
    if (f.size > 12 * 1024 * 1024) return setErr('That image is larger than 12 MB. Try a smaller photo.');
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const manual = () => ui.open({ k: 'circleExpense', circleId: circle, prefill: { method: 'itemized', items: [], notes: ['Entering items manually. Add each item from the bill and assign it to people.'] } });

  const loadDemoReceipt = () => {
    const sampleItems: ReceiptItem[] = [
      { id: uid(), name: 'Wood-fired Margherita Pizza', quantity: 1, unitPriceMinor: 35000, lineTotalMinor: 35000, assignees: [] },
      { id: uid(), name: 'Garlic Bread with Cheese', quantity: 1, unitPriceMinor: 14000, lineTotalMinor: 14000, assignees: [] },
      { id: uid(), name: 'Classic Cold Coffee', quantity: 2, unitPriceMinor: 13000, lineTotalMinor: 26000, assignees: [] },
    ];
    const prefill: Prefill = {
      title: 'Campus Cafe & Bistro',
      amountMinor: 78750, // 350 + 140 + 260 = 750 + 5% GST (37.50) = 787.50
      date: todayStr(),
      method: 'itemized',
      items: sampleItems,
      taxMinor: 3750,
      tipMinor: 0,
      discountMinor: 0,
      chargeRule: 'proportional',
      receipt: { merchant: 'Campus Cafe & Bistro', scanned: false },
      notes: [
        'Demo receipt scenario: Sample cafe bill pre-loaded for testing itemized splitting and tax reconciliation. (No live AI scanning was run).',
      ],
    };
    ui.open({ k: 'circleExpense', circleId: circle, prefill });
  };

  const scan = async () => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    ctl.current = new AbortController();
    try {
      const { receipt, warnings } = await scanReceipt(file, ctl.current.signal);
      const notes = [...warnings];
      if (receipt.uncertain_fields.length) notes.push(`The scanner wasn't sure about: ${receipt.uncertain_fields.join(', ')}. Please check these.`);
      if (receipt.currency !== state.profile.currency) notes.push(`The receipt looks like ${receipt.currency}, but this Circle uses ${state.profile.currency}. Check the amounts.`);
      const itemsSum = receipt.items.reduce((a, b) => a + b.line_total_minor, 0);
      const prefill: Prefill = {
        title: receipt.merchant || 'Receipt',
        amountMinor: receipt.total_minor ?? itemsSum + receipt.tax_minor + receipt.tip_minor - receipt.discount_minor,
        date: isValidDate(receipt.date) ? receipt.date : todayStr(),
        method: 'itemized',
        items: receipt.items.map((i) => ({ id: uid(), name: i.name, quantity: i.quantity, unitPriceMinor: i.unit_price_minor, lineTotalMinor: i.line_total_minor, assignees: [] })),
        taxMinor: receipt.tax_minor, tipMinor: receipt.tip_minor, discountMinor: receipt.discount_minor,
        receipt: { merchant: receipt.merchant, scanned: true },
        notes: [`Read from your receipt. Nothing is saved until you confirm. Scanned total: ${receipt.total_minor !== null ? formatMoney(receipt.total_minor, state.profile.currency) : 'not found'}.`, ...notes],
      };
      ui.open({ k: 'circleExpense', circleId: circle, prefill });
    } catch (e) {
      if (e instanceof ScanError && e.code === 'cancelled') return;
      setErr(e instanceof Error ? e.message : "We couldn't read this receipt clearly.");
    } finally {
      setBusy(false);
    }
  };

  if (state.circles.length === 0) {
    return (
      <Sheet title="Scan a receipt" onClose={onClose} footer={<Button variant="primary" onClick={() => ui.open({ k: 'circle' })}>Create a Circle</Button>}>
        <Notice tone="info">Receipts are split inside a Circle. Create one first, then scan.</Notice>
      </Sheet>
    );
  }

  return (
    <Sheet title="Scan a receipt" onClose={() => { ctl.current?.abort(); onClose(); }}
      footer={<><Button onClick={loadDemoReceipt}><Sparkles size={16} /> Demo scenario</Button><Button onClick={manual}>Enter manually</Button><Button variant="primary" disabled={!file || configured === false} loading={busy} onClick={scan}><ScanLine size={18} /> {busy ? 'Reading…' : 'Scan receipt'}</Button></>}>
      <div className="stack">
        <p className="muted">Upload a receipt and we'll help turn it into a split. You'll review everything before anything is saved.</p>
        {configured === false && (
          <Notice tone="warn">
            <div>
              <strong>AI scanning isn't configured on this machine.</strong> (It needs an <code>OPENAI_API_KEY</code> environment variable in <code>.env.local</code>).<br />
              You can test the full itemized split flow right now using the demo scenario or enter manually.
              <div style={{ marginTop: 8 }}>
                <Button size="sm" onClick={loadDemoReceipt}><Sparkles size={16} /> Load demo cafe receipt</Button>
              </div>
            </div>
          </Notice>
        )}
        {state.circles.length > 1 && !circleId && (
          <Field label="Circle">{(id) => <select id={id} className="input" value={circle} onChange={(e) => setCircle(e.target.value)}>{state.circles.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}</select>}</Field>
        )}
        <div className={`scan-box ${busy ? 'scan-line' : ''}`}>
          {preview ? <img src={preview} alt="Receipt preview" className="preview-img" /> : <ScanLine size={36} color="var(--forest)" aria-hidden />}
          {busy ? <strong role="status">Reading your receipt…</strong> : <span className="muted small">{file ? file.name : 'JPG, PNG, WebP or HEIC · up to 12 MB'}</span>}
          {!busy && (
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <label className="btn secondary sm" style={{ cursor: 'pointer' }}><ImageUp size={16} /> Choose image<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden onChange={(e) => pick(e.target.files?.[0])} /></label>
              <label className="btn secondary sm" style={{ cursor: 'pointer' }}><Camera size={16} /> Take photo<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} /></label>
            </div>
          )}
        </div>
        <p className="hint">The image is sent to OpenAI vision API only when you tap Scan, and isn't stored by Mesh.</p>
        {busy && <Button variant="ghost" onClick={() => ctl.current?.abort()}>Cancel</Button>}
        {err && <Notice tone="danger">{err} Your image is still selected — retry, or enter the details manually.</Notice>}
      </div>
    </Sheet>
  );
}
