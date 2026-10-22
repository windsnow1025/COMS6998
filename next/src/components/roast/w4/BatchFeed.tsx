import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import {isDone} from '@/lib/roast/PhotoResults';
import {BatchResDto, PhotoResDto} from '@/client/nest';
import {useRoast} from '../RoastContext';
import BatchSummary from '../BatchSummary';
import PhotoCard from './PhotoCard';
import styles from '../roast.module.css';

interface BatchFeedProps {
  // A batch with at least one photo
  batch: BatchResDto;
}

// A batch as a feed as Week 4 delivered it: every photo with its captions, a meter of the photos the viewer has judged,
// and the summary once all are.
// A closed batch is read-only: its results show to everyone, and a viewer who took part gets their summary first.
export default function BatchFeed({ batch }: BatchFeedProps) {
  const { viewer, paths } = useRoast();
  const router = useRouter();

  const [photos, setPhotos] = React.useState(batch.photos);
  // A viewer who returns to a finished or closed batch they took part in gets the summary first;
  // one who finishes an open batch now reaches it at the end of the feed
  const [wasDoneAtLoad] = React.useState(
    () => batch.photos.every(isDone) || (batch.closed && batch.photos.some(isDone)),
  );
  const summaryRef = React.useRef<HTMLDivElement>(null);

  const handleVoted = (voted: PhotoResDto) => {
    setPhotos((photos) => photos.map((photo) => (photo.id === voted.id ? voted : photo)));
  };

  const doneCount = photos.filter(isDone).length;
  const isAllDone = doneCount === photos.length;
  // Anonymous viewers cannot vote; the photos they have yet to see the verdict of are the ones they can sign in for
  const isOpenToVotes = photos.some((photo) => !photo.revealed);

  return (
    <>
      {viewer && !batch.closed && !wasDoneAtLoad && (
        <div className={styles.meter}>
          <div className={styles.progress} role="img" aria-label={`${doneCount} of ${photos.length} photos judged`}>
            {photos.map((photo, index) => (
              <span key={photo.id} className={styles.progressStep} data-done={index < doneCount} />
            ))}
          </div>
          {isAllDone ? (
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSmall}`}
              onClick={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              My results
              <ArrowDownwardRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          ) : (
            <span className={styles.progressLabel}>
              {doneCount} of {photos.length}
            </span>
          )}
        </div>
      )}

      <div className={styles.stack}>
        {viewer && wasDoneAtLoad && <BatchSummary batch={{ ...batch, photos }} />}
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} onVoted={handleVoted} />
        ))}
        {viewer && !batch.closed && !wasDoneAtLoad && isAllDone && (
          <div ref={summaryRef} className={styles.feedEnd}>
            <BatchSummary batch={{ ...batch, photos }} />
          </div>
        )}
        {!viewer && isOpenToVotes && (
          <Link href={paths.signIn(router.asPath)} className={`${styles.button} ${styles.buttonBlock}`}>
            Sign in to vote on all {photos.length}
          </Link>
        )}
      </div>
    </>
  );
}
