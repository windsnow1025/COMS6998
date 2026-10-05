import * as React from 'react';

interface LoadState<Data> {
  key: string;
  data: Data | null;
  error: string;
}

export interface Load<Data> {
  // The data loaded for the current key; null until it arrives
  data: Data | null;
  // The message of the failed load; empty otherwise
  error: string;
  reload: () => void;
  // Replaces the loaded data, after a change the page made itself
  setData: (data: Data) => void;
}

// Loads data whenever the key changes, and never shows the data of another key.
// A null key waits: nothing loads until the key is known. `load` is stable across renders.
export function useLoad<Data>(key: string | null, load: () => Promise<Data>): Load<Data> {
  const [state, setState] = React.useState<LoadState<Data> | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (key === null) {
      return;
    }

    let isStale = false;
    load().then(
      (data) => {
        if (!isStale) {
          setState({ key, data, error: '' });
        }
      },
      (error: Error) => {
        if (!isStale) {
          setState({ key, data: null, error: error.message });
        }
      },
    );
    return () => {
      isStale = true;
    };
  }, [key, load, attempt]);

  const current = state?.key === key ? state : null;
  const reload = React.useCallback(() => setAttempt((attempt) => attempt + 1), []);
  const setData = React.useCallback(
    (data: Data) => setState((state) => (state ? { ...state, data } : state)),
    [],
  );

  return { data: current?.data ?? null, error: current?.error ?? '', reload, setData };
}
