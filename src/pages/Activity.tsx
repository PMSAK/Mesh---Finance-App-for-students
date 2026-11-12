import { useState } from 'react';
import { History } from 'lucide-react';
import { Card, Empty, Segmented } from '../components/ui';
import { ActivityRow } from '../components/Rows';
import { useStore } from '../store';
import { useUI } from '../ui-context';
import type { ActivityType } from '../lib/types';

type Filter = 'all' | 'personal' | 'circle' | 'settlements';
const GROUPS: Record<Exclude<Filter, 'all'>, ActivityType[]> = {
  personal: ['personal_expense', 'commitment_added', 'commitment_paid'],
  circle: ['circle_created', 'circle_expense', 'receipt_confirmed', 'expense_edited', 'expense_deleted'],
  settlements: ['settlement', 'settlement_cancelled'],
};

export function Activity() {
  const { state } = useStore();
  const ui = useUI();
  const [f, setF] = useState<Filter>('all');
  const list = state.events.filter((e) => f === 'all' || GROUPS[f].includes(e.type));
  return (
    <>
      <div className="page-head"><div><h1>Activity</h1><p>Everything that's changed, in one place.</p></div></div>
      {state.isDemo && <div className="demo-banner">Includes sample data from the demo.</div>}
      <div className="stack">
        <Segmented<Filter> label="Filter activity" value={f} onChange={setF} options={[{ value: 'all', label: 'All' }, { value: 'personal', label: 'Personal' }, { value: 'circle', label: 'Circles' }, { value: 'settlements', label: 'Settlements' }]} />
        <Card tight>
          {list.length === 0 ? (
            <Empty icon={History} title={state.events.length ? 'Nothing here.' : 'No activity yet.'} text={state.events.length ? 'No events match this filter.' : 'Add an expense or create a Circle and it will appear here.'} />
          ) : (
            <div className="divide">
              {list.map((e) => <ActivityRow key={e.id} e={e} currency={state.profile.currency} onClick={e.circleId && state.circles.some((c) => c.id === e.circleId) ? () => ui.go(`/circles/${e.circleId}`) : undefined} />)}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
