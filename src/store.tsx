import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState } from './lib/types';
import { initialState } from './lib/actions';
import { demoState } from './lib/demo';
import { todayStr } from './lib/dates';

/**
 * Persistence: browser localStorage ONLY. This is a single-device prototype store, not a
 * multi-user backend; there are no accounts, sync or access control beyond the browser profile.
 */
const KEY = 'mesh.v2';

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as AppState;
      if (p && p.version === 1 && p.profile) return p;
    }
  } catch {
    /* corrupted storage falls back to a fresh state */
  }
  return demoState(todayStr());
}

export type ApplyResult = { ok: true } | { ok: false; error: string };

interface Store {
  state: AppState;
  /** Run a pure transition. State only changes if the transition AND the write to storage succeed. */
  apply: (fn: (s: AppState) => AppState) => ApplyResult;
  startDemo: () => void;
  resetAll: () => void;
  replace: (s: AppState) => ApplyResult;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const ref = useRef(state);

  const commit = useCallback((next: AppState): ApplyResult => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      return { ok: false, error: "Couldn't save on this device (storage is full or blocked). Your entries are still here — try again." };
    }
    ref.current = next;
    setState(next);
    return { ok: true };
  }, []);

  const apply = useCallback(
    (fn: (s: AppState) => AppState): ApplyResult => {
      try {
        return commit(fn(ref.current));
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' };
      }
    },
    [commit],
  );

  const value = useMemo<Store>(
    () => ({
      state,
      apply,
      replace: commit,
      startDemo: () => void commit(demoState(todayStr())),
      resetAll: () => {
        const fresh = initialState();
        try {
          localStorage.setItem(KEY, JSON.stringify(fresh));
        } catch {
          /* ignore */
        }
        ref.current = fresh;
        setState(fresh);
      },
    }),
    [state, apply, commit],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const c = useContext(Ctx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}
