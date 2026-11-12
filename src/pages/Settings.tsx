import { useState } from 'react';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { Avatar, Button, Card, ConfirmSheet, Field, Notice, useToast } from '../components/ui';
import { FinanceForm } from '../sheets/PersonalSheets';
import { useStore } from '../store';
import { updateProfile } from '../lib/actions';

export function Settings() {
  const { state, apply, startDemo, resetAll } = useStore();
  const toast = useToast();
  const [name, setName] = useState(state.profile.name);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mesh-data.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Exported your data as JSON.');
  };

  return (
    <>
      <div className="page-head"><div><h1>Settings</h1><p>Your details and how your runway is calculated.</p></div></div>
      <div className="cols-2">
        <div className="stack">
          <Card>
            <h2 style={{ marginBottom: 12 }}>Personal details</h2>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <Avatar name={state.profile.name} size={48} />
              <div className="grow"><Field label="Display name">{(id) => <input id={id} className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />}</Field></div>
              <Button onClick={() => { const r = apply((s) => updateProfile(s, { name })); r.ok ? (setErr(null), toast('Name updated.')) : setErr(r.error); }}>Save</Button>
            </div>
            {err && <div style={{ marginTop: 8 }}><Notice tone="danger">{err}</Notice></div>}
            <p className="small muted" style={{ marginTop: 8 }}>Currency: INR (₹). Other currencies aren't supported yet.</p>
          </Card>
          <Card>
            <h2 style={{ marginBottom: 12 }}>Financial preferences</h2>
            <FinanceForm />
          </Card>
        </div>
        <div className="stack">
          <Card>
            <h2 style={{ marginBottom: 6 }}>Circle preferences</h2>
            <p className="muted">Each Circle has its own settlement threshold. Open a Circle and choose the Vibe Ledger tab to change it.</p>
          </Card>
          <Card>
            <h2 style={{ marginBottom: 6 }}>Demo & Data controls</h2>
            <p className="muted" style={{ marginBottom: 12 }}>Mesh stores everything locally in this browser. You can reset to the original sample scenario or clear everything to test the initial onboarding flow.</p>
            <div className="stack-sm">
              <Button onClick={() => { startDemo(); toast('Demo data restored to initial state.'); }}><RotateCcw size={18} /> Reset to demo data</Button>
              <Button onClick={exportData}><Download size={18} /> Export my data (JSON)</Button>
              <Button variant="danger" onClick={() => setConfirm(true)}><Trash2 size={18} /> Delete all data & test fresh onboarding</Button>
            </div>
          </Card>
          <Card>
            <h2 style={{ marginBottom: 6 }}>Account</h2>
            <p className="muted">No sign-in yet — this prototype has a single local profile{state.isDemo ? ' (currently showing demo data)' : ''}. Sign-out and multi-user Circles need a backend, which isn't built.</p>
          </Card>
        </div>
      </div>
      {confirm && <ConfirmSheet title="Delete everything?" danger confirmLabel="Delete all data" onClose={() => setConfirm(false)} onConfirm={() => { resetAll(); window.location.hash = '/'; }}
        body={<p>This removes your balance, expenses, Circles and settlements from this browser. It can't be undone — export first if you want a copy.</p>} />}
    </>
  );
}
