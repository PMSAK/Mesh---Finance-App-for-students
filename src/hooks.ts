import { useMemo } from 'react';
import { useStore } from './store';
import { computeRunway } from './lib/runway';
import { groupPosition, runwayInputFor, unpaidCommitmentsTotal } from './lib/accounting';
import { todayStr } from './lib/dates';

/** One place that derives every number the screens show, from the single underlying state. */
export function useFinance() {
  const { state } = useStore();
  const today = todayStr();
  return useMemo(() => {
    const input = runwayInputFor(state, today);
    const runway = computeRunway(input);
    const group = groupPosition(state);
    return { state, today, input, runway, cash: input.balanceMinor, group, commitmentsTotal: unpaidCommitmentsTotal(state), currency: state.profile.currency };
  }, [state, today]);
}
