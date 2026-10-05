import * as React from 'react';
import Link from 'next/link';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import BatchFeed from './BatchFeed';
import {LoadError, Loading} from './Status';
import styles from './roast.module.css';

// The home of the product: today's batch, and the way to the previous batch's verdicts
export default function TodayView() {
  const { viewer, viewerLoaded, paths } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  // The batch depends on the viewer, whose votes and uploads it reflects
  const key = viewerLoaded ? `today:${viewer?.id ?? ''}` : null;
  const loadBatch = React.useCallback(() => roastLogic.fetchTodayBatch(), [roastLogic]);
  const batch = useLoad(key, loadBatch);
  const loadRecent = React.useCallback(() => roastLogic.fetchRecentBatches(), [roastLogic]);
  const recent = useLoad(key, loadRecent);

  const previous = batch.data && recent.data?.find(({ date }) => date < batch.data!.date);

  return (
    <>
      <h1 className={styles.title}>
        {viewer ? "Today's batch" : 'Pick the funniest caption.'}
      </h1>
      <p className={styles.subtitle}>
        {viewer && batch.data
          ? formatCampusDate(batch.data.date)
          : 'A fresh batch of photos every day. AI writes the roasts. You pick the winner.'}
      </p>

      <div className="mt-5">
        {batch.error && <LoadError message={batch.error} onRetry={batch.reload} />}
        {!batch.data && !batch.error && <Loading />}
        {batch.data && batch.data.photos.length === 0 && (
          <div className={`${styles.card} ${styles.empty}`}>
            <p>No photo is in line for today&apos;s batch. Yours can open it.</p>
            <Link href={paths.roast} className={styles.button}>
              Roast my photo
            </Link>
          </div>
        )}
        {batch.data && batch.data.photos.length > 0 && (
          <BatchFeed key={key} batch={batch.data} />
        )}
      </div>

      {previous && (
        <Link href={paths.batch(previous.date)} className={`${styles.notice} mt-7`}>
          <span className={styles.noticeText}>
            <strong>{formatCampusDate(previous.date)}</strong>
            <br />
            <span className={`${styles.muted} ${styles.small}`}>See how the crowd voted on the last batch</span>
          </span>
          <ArrowForwardRoundedIcon />
        </Link>
      )}
    </>
  );
}
