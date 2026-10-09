import * as React from 'react';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {useBatch} from '../useBatch';
import BatchFeed from '../BatchFeed';
import {LoadError, Loading} from '../Status';
import styles from '../roast.module.css';

interface BatchViewProps {
  // The batch's campus date, as YYYY-MM-DD; undefined until the router knows the route's query
  date: string | undefined;
}

// A batch of an earlier date as Week 4 delivered it: its verdicts, which everyone sees, since voting ended with its date
export default function BatchView({ date }: BatchViewProps) {
  const { key, batch } = useBatch(date);

  return (
    <>
      <h1 className={styles.title}>{date ? formatCampusDate(date) : 'Batch'}</h1>
      <p className={styles.subtitle}>The batch of that day and how the crowd voted.</p>

      <div className="mt-5">
        {batch.error && <LoadError message={batch.error} onRetry={batch.reload} />}
        {!batch.data && !batch.error && <Loading />}
        {batch.data && batch.data.photos.length === 0 && (
          <div className={`${styles.card} ${styles.empty}`}>
            <p>This batch has no photos left.</p>
          </div>
        )}
        {batch.data && batch.data.photos.length > 0 && <BatchFeed key={key} batch={batch.data} />}
      </div>
    </>
  );
}
