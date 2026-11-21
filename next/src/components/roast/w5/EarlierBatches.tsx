import * as React from 'react';
import Link from 'next/link';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {BatchSummaryResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import styles from './roast.module.css';

// One batch as a tile, the way to its page
export function BatchTile({ batch }: { batch: BatchSummaryResDto }) {
  const { paths } = useRoast();

  return (
    <Link href={paths.batch(batch.date)} className={styles.archiveTile}>
      <div className={styles.archiveCover}>
        {batch.coverUrl && (
          <>
            {/* The photo is served from object storage, outside the image optimizer */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={batch.coverUrl} alt="" className={styles.photoImage} loading="lazy" />
          </>
        )}
      </div>
      <div className={styles.archiveBody}>
        <strong>{formatCampusDate(batch.date)}</strong>
        <span className={styles.muted}>
          {batch.photoCount} {batch.photoCount === 1 ? 'photo' : 'photos'}
        </span>
      </div>
    </Link>
  );
}

interface EarlierBatchesProps {
  // The batches before today's, the latest first; undefined until they have loaded
  batches: BatchSummaryResDto[] | undefined;
}

// The batches before today's, each the way to how the crowd voted on it
export default function EarlierBatches({ batches }: EarlierBatchesProps) {
  if (!batches || batches.length === 0) {
    return null;
  }

  return (
    <section>
      <div className={styles.batchHead}>
        <h2 className={styles.sectionTitle}>Earlier batches</h2>
        <span className={`${styles.muted} ${styles.small}`}>How the crowd voted</span>
      </div>
      <ul className={styles.archive}>
        {batches.map((batch) => (
          <li key={batch.date}>
            <BatchTile batch={batch} />
          </li>
        ))}
      </ul>
    </section>
  );
}
