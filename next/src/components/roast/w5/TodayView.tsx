import * as React from 'react';
import Link from 'next/link';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import GoogleSignInButton from '@/components/common/components/GoogleSignInButton';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {isDone} from '@/lib/roast/PhotoResults';
import {useRoast} from '../RoastContext';
import {useTodayBatch} from '../useTodayBatch';
import Intro from './Intro';
import TodayBatch from '../TodayBatch';
import EarlierPicks from '../EarlierPicks';
import EarlierBatches from '../EarlierBatches';
import styles from '../roast.module.css';

// The home as Week 5 delivered it: today's batch, under the introduction for a visitor who is not signed in,
// the viewer's earlier picks the batch serves again, and the earlier batches
export default function TodayView() {
  const { viewer, viewerLoaded, paths } = useRoast();
  const load = useTodayBatch();
  const batchRef = React.useRef<HTMLDivElement>(null);

  const date = load.batch.data?.date ?? null;
  // The batch as loaded; the viewer's votes since then are the feed's
  const isJudged = load.batch.data?.photos.every(isDone) ?? false;

  return (
    <>
      {viewerLoaded && !viewer && (
        <>
          <Intro
            actions={
              <>
                <div className={styles.introSignIn}>
                  <GoogleSignInButton />
                </div>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => batchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Browse today&apos;s batch
                  <ArrowDownwardRoundedIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom' }} />
                </button>
              </>
            }
          />
          <div ref={batchRef} className={styles.batchHead}>
            <h2 className={styles.sectionTitle}>Today&apos;s batch</h2>
            {date && <span className={`${styles.muted} ${styles.small}`}>{formatCampusDate(date)}</span>}
          </div>
        </>
      )}
      {viewer && (
        <>
          <h1 className={styles.title}>Today&apos;s batch</h1>
          {date && (
            <p className={styles.subtitle}>
              {isJudged ? formatCampusDate(date) : 'Tap the funniest caption under each photo.'}
            </p>
          )}
          <p className={`${styles.muted} ${styles.small} mt-2`}>
            <Link href={paths.about} className={styles.link}>
              How Daily Roast works
            </Link>
          </p>
        </>
      )}
      <TodayBatch load={load} />
      <EarlierPicks photos={load.batch.data?.judgedBefore} />
      <EarlierBatches batches={load.earlier} />
    </>
  );
}
