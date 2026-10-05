import * as React from 'react';
import styles from './roast.module.css';

export function Loading() {
  return (
    <div className={styles.center} role="status" aria-label="Loading">
      <div className={styles.spinner} />
    </div>
  );
}

interface LoadErrorProps {
  message: string;
  onRetry: () => void;
}

export function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div className={`${styles.card} ${styles.empty}`}>
      <p>{message}</p>
      <button type="button" className={styles.buttonGhost} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
