import * as React from 'react';
import RoastLogic from '@/lib/roast/RoastLogic';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import BatchFeed from './BatchFeed';
import {LoadError, Loading} from './Status';
import styles from './roast.module.css';

interface BatchViewProps {
  // The batch's campus date, as YYYY-MM-DD; undefined until the router knows the route's query
  date: string | undefined;
}

// A batch of an earlier date: its verdicts, and the photos the viewer has yet to vote on
export default function BatchView({ date }: BatchViewProps) {
  const { viewer, viewerLoaded } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const key = viewerLoaded && date ? `batch:${date}:${viewer?.id ?? ''}` : null;
  const loadBatch = React.useCallback(() => roastLogic.fetchBatch(date!), [roastLogic, date]);
  const batch = useLoad(key, loadBatch);

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
