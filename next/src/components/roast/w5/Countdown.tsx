import * as React from 'react';
import {formatCountdown, getSecondsToNextBatch} from '@/lib/roast/CampusTime';
import styles from './roast.module.css';

// The time left until the next batch opens, at campus midnight.
// Rendered in the browser only, after a fetch: the server and the browser would read different clocks.
export default function Countdown() {
  const [seconds, setSeconds] = React.useState(() => getSecondsToNextBatch(new Date()));

  React.useEffect(() => {
    const timer = setInterval(() => setSeconds(getSecondsToNextBatch(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <p className={styles.countdown}>
      Next batch in <span className={styles.countdownValue}>{formatCountdown(seconds)}</span>
    </p>
  );
}
