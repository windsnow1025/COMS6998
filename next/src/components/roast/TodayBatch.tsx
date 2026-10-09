import * as React from 'react';
import Link from 'next/link';
import {useRoast} from './RoastContext';
import {TodayBatchLoad} from './useTodayBatch';
import BatchFeed from './BatchFeed';
import {LoadError, Loading} from './Status';
import styles from './roast.module.css';

interface TodayBatchProps {
  load: TodayBatchLoad;
}

// Today's batch as a feed
export default function TodayBatch({ load: { key, batch } }: TodayBatchProps) {
  const { paths } = useRoast();

  return (
    <div className="mt-5">
      {batch.error && <LoadError message={batch.error} onRetry={batch.reload} />}
      {!batch.data && !batch.error && <Loading />}
      {batch.data && batch.data.photos.length === 0 && (
        <div className={`${styles.card} ${styles.empty}`}>
          {batch.data.judgedBefore.length > 0 ? (
            // The batch holds only photos the viewer judged on earlier dates; a new upload still joins it
            <p>No new photo for you today. Your earlier picks are still collecting votes.</p>
          ) : (
            <p>No photo is in line for today&apos;s batch. Yours can open it.</p>
          )}
          <Link href={paths.roast} className={styles.button}>
            Roast my photo
          </Link>
        </div>
      )}
      {batch.data && batch.data.photos.length > 0 && <BatchFeed key={key} batch={batch.data} />}
    </div>
  );
}
