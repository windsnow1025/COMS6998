import * as React from 'react';
import Link from 'next/link';
import {getWinner} from '@/lib/roast/PhotoResults';
import {PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import {describeStanding} from './PickStanding';
import styles from './roast.module.css';

interface EarlierPicksProps {
  // The batch's photos the viewer judged before its date; nothing renders while there are none
  photos: PhotoResDto[] | undefined;
}

// The viewer's earlier picks that the batch serves again for more votes, each the way to its photo page,
// where the verdict lands once enough others have voted
export default function EarlierPicks({ photos }: EarlierPicksProps) {
  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <section>
      <div className={styles.batchHead}>
        <h2 className={styles.sectionTitle}>Your earlier picks</h2>
        <span className={`${styles.muted} ${styles.small}`}>Served again for more votes</span>
      </div>
      <div className={`${styles.list} mt-4`}>
        {photos.map((photo) => (
          <EarlierPick key={photo.id} photo={photo} />
        ))}
      </div>
    </section>
  );
}

function EarlierPick({ photo }: { photo: PhotoResDto }) {
  const { paths } = useRoast();
  const pick = photo.captions.find(({ id }) => id === photo.viewer.captionId);
  const caption = pick ?? getWinner(photo) ?? photo.captions.at(0);

  return (
    <Link href={paths.photo(photo.id)} className={styles.thumbRow}>
      {/* The photo is served from object storage, outside the image optimizer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.description} className={styles.thumb} loading="lazy" />
      <div className={styles.thumbBody}>
        <p className={styles.thumbCaption}>{caption?.content}</p>
        <div className={`${styles.muted} ${styles.small}`}>{describeStanding(photo)}</div>
      </div>
    </Link>
  );
}
