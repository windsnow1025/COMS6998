import * as React from 'react';
import Link from 'next/link';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import BatchFeed from './BatchFeed';
import Intro from './Intro';
import {LoadError, Loading} from './Status';
import styles from './roast.module.css';

// The home of the product: today's batch, and the way to the previous batch's verdicts.
// A visitor who is not signed in gets the product's introduction first.
export default function TodayView() {
  const { viewer, viewerLoaded, paths } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);
  const batchRef = React.useRef<HTMLDivElement>(null);

  // The batch depends on the viewer, whose votes and uploads it reflects
  const key = viewerLoaded ? `today:${viewer?.id ?? ''}` : null;
  const loadBatch = React.useCallback(() => roastLogic.fetchTodayBatch(), [roastLogic]);
  const batch = useLoad(key, loadBatch);
  const loadRecent = React.useCallback(() => roastLogic.fetchRecentBatches(), [roastLogic]);
  const recent = useLoad(key, loadRecent);

  const previous = batch.data && recent.data?.find(({ date }) => date < batch.data!.date);

  return (
    <>
      {viewerLoaded && !viewer && (
        <>
          <Intro batchRef={batchRef} />
          <div ref={batchRef} className={styles.batchHead}>
            <h2 className={styles.sectionTitle}>Today&apos;s batch</h2>
            {batch.data && (
              <span className={`${styles.muted} ${styles.small}`}>{formatCampusDate(batch.data.date)}</span>
            )}
          </div>
        </>
      )}
      {viewer && (
        <>
          <h1 className={styles.title}>Today&apos;s batch</h1>
          {batch.data && <p className={styles.subtitle}>{formatCampusDate(batch.data.date)}</p>}
        </>
      )}

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
