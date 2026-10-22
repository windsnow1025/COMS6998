import * as React from 'react';
import Link from 'next/link';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GoogleSignInButton from '@/components/common/components/GoogleSignInButton';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {useRoast} from './RoastContext';
import {useTodayBatch} from './useTodayBatch';
import BatchFeed from './BatchFeed';
import TodayBatch from './TodayBatch';
import EarlierPicks from './EarlierPicks';
import EarlierBatches from './EarlierBatches';
import styles from './roast.module.css';

// The home of the product: today's batch, under the pitch and the ways in for a visitor who is not signed in,
// the viewer's earlier picks the batch serves again, and the earlier batches. The home holds what a visitor
// needs to start; the whole story lives on the landing page behind "How it works".
export default function TodayView() {
  const { viewer, viewerLoaded } = useRoast();
  const load = useTodayBatch();
  const batchRef = React.useRef<HTMLDivElement>(null);

  const date = load.batch.data?.date ?? null;

  return (
    <>
      {viewerLoaded && !viewer && (
        <>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              AI writes the captions. <span className={styles.heroAccent}>You pick the funniest.</span>
            </h1>
            <AboutLink />
          </div>
          <div className={styles.heroActions}>
            <div className={styles.heroSignIn}>
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
          </div>
          <div ref={batchRef} className={styles.batchHead}>
            <h2 className={styles.sectionTitle}>Today&apos;s batch</h2>
            {date && <span className={`${styles.muted} ${styles.small}`}>{formatCampusDate(date)}</span>}
          </div>
        </>
      )}
      {viewer && (
        <>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Today&apos;s batch</h1>
            <AboutLink />
          </div>
          {date && <p className={styles.subtitle}>{formatCampusDate(date)}</p>}
        </>
      )}
      <TodayBatch load={load} feed={BatchFeed} />
      <EarlierPicks photos={load.batch.data?.judgedBefore} />
      <EarlierBatches batches={load.earlier} />
    </>
  );
}

// The way to the landing page, at the right end of the home's first row
function AboutLink() {
  const { paths } = useRoast();

  return (
    <Link href={paths.about} className={styles.aboutLink}>
      <InfoOutlinedIcon sx={{ fontSize: 18 }} />
      How it works
    </Link>
  );
}
