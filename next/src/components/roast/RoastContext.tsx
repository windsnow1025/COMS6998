import * as React from 'react';
import UserClient from '@/lib/common/user/UserClient';
import {getErrorStatus} from '@/lib/common/ErrorHandler';
import {StorageKeys} from '@/lib/common/Constants';
import {RoastPaths} from '@/lib/roast/RoastPaths';
import {UserResDto} from '@/client/nest';
import styles from './roast.module.css';

export interface RoastContextValue {
  paths: RoastPaths;
  // The signed-in user; null while signed out, and while the first fetch runs
  viewer: UserResDto | null;
  // Whether the viewer's fetch has finished
  viewerLoaded: boolean;
  refreshViewer: () => Promise<void>;
  signOut: () => void;
  // Shows a short message at the bottom of the screen
  notify: (message: string) => void;
}

const RoastContext = React.createContext<RoastContextValue | null>(null);

export function useRoast(): RoastContextValue {
  const context = React.useContext(RoastContext);
  if (!context) {
    throw new Error('useRoast is used outside of RoastProvider');
  }
  return context;
}

// The viewer of the previous page, shown until the next page's fetch finishes
let cachedViewer: UserResDto | null = null;

const ToastDurationMs = 3000;
const Unauthorized = 401;

// The signed-in user; null when no token is stored, or the stored token is no longer accepted
async function fetchViewer(): Promise<UserResDto | null> {
  if (!localStorage.getItem(StorageKeys.Token)) {
    return null;
  }
  try {
    return await new UserClient().fetchUser();
  } catch (error) {
    if (getErrorStatus(error) === Unauthorized) {
      localStorage.removeItem(StorageKeys.Token);
      return null;
    }
    throw error;
  }
}

interface RoastProviderProps {
  paths: RoastPaths;
  children: React.ReactNode;
}

export function RoastProvider({ paths, children }: RoastProviderProps) {
  const [viewer, setViewer] = React.useState<UserResDto | null>(cachedViewer);
  const [viewerLoaded, setViewerLoaded] = React.useState(cachedViewer !== null);
  const [toast, setToast] = React.useState('');

  const applyViewer = React.useCallback((user: UserResDto | null) => {
    cachedViewer = user;
    setViewer(user);
    setViewerLoaded(true);
  }, []);

  const refreshViewer = React.useCallback(async () => {
    applyViewer(await fetchViewer());
  }, [applyViewer]);

  const signOut = React.useCallback(() => {
    localStorage.removeItem(StorageKeys.Token);
    cachedViewer = null;
    setViewer(null);
  }, []);

  React.useEffect(() => {
    fetchViewer().then(applyViewer, () => {
      setToast('The server did not answer. Check your connection.');
      setViewerLoaded(true);
    });
  }, [applyViewer]);

  React.useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(''), ToastDurationMs);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = React.useMemo(
    () => ({ paths, viewer, viewerLoaded, refreshViewer, signOut, notify: setToast }),
    [paths, viewer, viewerLoaded, refreshViewer, signOut],
  );

  return (
    <RoastContext.Provider value={value}>
      {children}
      {toast && (
        <div className={styles.toastHost} role="status">
          <div className={styles.toast}>{toast}</div>
        </div>
      )}
    </RoastContext.Provider>
  );
}
