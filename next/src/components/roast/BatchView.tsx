import * as React from 'react';
import Link from 'next/link';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {useRoast} from './RoastContext';
import {useBatch} from './useBatch';
import BatchFeed from './BatchFeed';
import EarlierPicks from './EarlierPicks';
import {LoadError, Loading} from './Status';
import styles from './roast.module.css';

interface BatchViewProps {
  // The batch's campus date, as YYYY-MM-DD; undefined until the router knows the route's query
  date: string | undefined;
}

// A batch of an earlier date: its verdicts, which everyone sees, since voting ended with its date,
// with the way to the batches around it and the viewer's own earlier picks that it served again
export default function BatchView({ date }: BatchViewProps) {
  const { paths } = useRoast();
  const { key, batch } = useBatch(date);

  return (
    <>
      <h1 className={styles.title}>{date ? formatCampusDate(date) : 'Batch'}</h1>
      <p className={styles.subtitle}>The batch of that day and how the crowd voted.</p>
      {batch.data && (batch.data.previousDate || batch.data.nextDate) && (
        <nav className={styles.batchNav} aria-label="Nearby batches">
          {batch.data.previousDate ? (
            <Link href={paths.batch(batch.data.previousDate)} className={styles.linkButton}>
              <ArrowBackRoundedIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom' }} />
              {formatCampusDate(batch.data.previousDate)}
            </Link>
          ) : (
            <span />
          )}
          {batch.data.nextDate && (
            <Link href={paths.batch(batch.data.nextDate)} className={styles.linkButton}>
              {formatCampusDate(batch.data.nextDate)}
              <ArrowForwardRoundedIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom' }} />
            </Link>
          )}
        </nav>
      )}

      <div className="mt-5">
        {batch.error && <LoadError message={batch.error} onRetry={batch.reload} />}
        {!batch.data && !batch.error && <Loading />}
        {batch.data && batch.data.photos.length === 0 && batch.data.judgedBefore.length === 0 && (
          <div className={`${styles.card} ${styles.empty}`}>
            <p>This batch has no photos left.</p>
          </div>
        )}
        {batch.data && batch.data.photos.length > 0 && <BatchFeed key={key} batch={batch.data} />}
      </div>
      <EarlierPicks photos={batch.data?.judgedBefore} />
    </>
  );
}
