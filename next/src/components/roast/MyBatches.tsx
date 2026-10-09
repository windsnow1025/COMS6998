import * as React from 'react';
import Link from 'next/link';
import RoastLogic from '@/lib/roast/RoastLogic';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import {BatchTile} from './EarlierBatches';
import {LoadError, Loading} from './Status';
import styles from './roast.module.css';

// The batches the viewer took part in, the latest first, each the way to its page
export default function MyBatches() {
  const { viewer, paths } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const key = viewer ? `my-batches:${viewer.id}` : null;
  const loadBatches = React.useCallback(() => roastLogic.fetchMyBatches(), [roastLogic]);
  const batches = useLoad(key, loadBatches);

  return (
    <section>
      <div className={styles.batchHead}>
        <h2 className={styles.sectionTitle}>Your batches</h2>
        <span className={`${styles.muted} ${styles.small}`}>The days you played</span>
      </div>
      {batches.error && <LoadError message={batches.error} onRetry={batches.reload} />}
      {!batches.data && !batches.error && <Loading />}
      {batches.data && batches.data.length === 0 && (
        <div className={`${styles.card} ${styles.empty} mt-4`}>
          <p>You have not voted in a batch yet.</p>
          <Link href={paths.today} className={styles.button}>
            Today&apos;s batch
          </Link>
        </div>
      )}
      {batches.data && batches.data.length > 0 && (
        <ul className={styles.archive}>
          {batches.data.map((batch) => (
            <li key={batch.date}>
              <BatchTile batch={batch} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
