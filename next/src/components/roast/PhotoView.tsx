import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {getWinners} from '@/lib/roast/PhotoResults';
import {share} from '@/lib/roast/Share';
import {PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import PhotoCard from './PhotoCard';
import {LoadError, Loading} from './Status';
import styles from './roast.module.css';

interface PhotoViewProps {
  // The photo's id; undefined until the router knows the route's query
  id: string | undefined;
}

// One photo on its own page, which is the link that people share
export default function PhotoView({ id }: PhotoViewProps) {
  const { viewer, viewerLoaded, paths, notify } = useRoast();
  const router = useRouter();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const key = viewerLoaded && id ? `photo:${id}:${viewer?.id ?? ''}` : null;
  const loadPhoto = React.useCallback(() => roastLogic.fetchPhoto(id!), [roastLogic, id]);
  const { data: photo, error: loadError, reload, setData: setPhoto } = useLoad(key, loadPhoto);

  const [isWorking, setIsWorking] = React.useState(false);
  const [error, setError] = React.useState('');
  const deleteDialogRef = React.useRef<HTMLDialogElement>(null);

  if (loadError) {
    return <LoadError message={loadError} onRetry={reload} />;
  }
  if (!photo) {
    return <Loading />;
  }

  const handleShare = async () => {
    const winner = photo.revealed ? getWinners(photo).at(0) : undefined;
    const result = await share({
      title: 'Daily Roast',
      text: winner ? `“${winner.content}”` : 'Which roast wins this photo?',
      url: `${window.location.origin}${paths.photo(photo.id)}`,
    });
    if (result === 'copied') {
      notify('Link copied.');
    }
  };

  const handleWriteCaptions = async () => {
    setIsWorking(true);
    setError('');
    try {
      setPhoto(await roastLogic.writeCaptions(photo.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDelete = async () => {
    setIsWorking(true);
    setError('');
    try {
      await roastLogic.deletePhoto(photo.id);
      notify('Photo deleted.');
      await router.push(paths.me);
    } catch (err) {
      deleteDialogRef.current?.close();
      setError((err as Error).message);
      setIsWorking(false);
    }
  };

  return (
    <>
      {photo.captions.length > 0 ? (
        <>
          <h1 className={`${styles.title} ${styles.photoTitle}`}>
            {photo.revealed ? 'The verdict' : 'Which roast wins?'}
          </h1>
          <PhotoCard photo={photo} onVoted={setPhoto} />
        </>
      ) : (
        <UncaptionedPhoto photo={photo} isWorking={isWorking} onWriteCaptions={handleWriteCaptions} />
      )}

      {error && <p className={styles.error}>{error}</p>}

      <p className={`${styles.muted} ${styles.small} mt-4`}>
        {photo.batchDate && (
          <>
            Served in the batch of{' '}
            <Link href={paths.batch(photo.batchDate)} className={styles.link}>
              {formatCampusDate(photo.batchDate)}
            </Link>
            .
          </>
        )}
        {!photo.batchDate && photo.queuePosition !== undefined && `Number ${photo.queuePosition} in line for a batch.`}
        {!photo.batchDate && photo.queuePosition === undefined && 'Waiting in line for a batch.'}
      </p>

      <div className={`${styles.actions} mt-3`}>
        <button type="button" className={styles.buttonGhost} onClick={handleShare}>
          <IosShareRoundedIcon fontSize="small" />
          Share
        </button>
        {photo.viewer.isOwner && (
          <button type="button" className={styles.buttonGhost} onClick={() => deleteDialogRef.current?.showModal()}>
            <DeleteOutlineRoundedIcon fontSize="small" />
            Delete
          </button>
        )}
      </div>

      <dialog ref={deleteDialogRef} className={styles.dialog}>
        <h2 className={styles.dialogTitle}>Delete this photo?</h2>
        <p className={styles.muted}>Its captions and votes are deleted with it. This cannot be undone.</p>
        <div className={`${styles.actions} ${styles.actionsFill} mt-5`}>
          <button type="button" className={styles.buttonGhost} onClick={() => deleteDialogRef.current?.close()}>
            Keep it
          </button>
          <button type="button" className={styles.button} disabled={isWorking} onClick={handleDelete}>
            Delete
          </button>
        </div>
      </dialog>
    </>
  );
}

interface UncaptionedPhotoProps {
  photo: PhotoResDto;
  isWorking: boolean;
  onWriteCaptions: () => void;
}

// A photo whose captions were never written: its uploader left, or the LLM failed, between the two steps
function UncaptionedPhoto({ photo, isWorking, onWriteCaptions }: UncaptionedPhotoProps) {
  return (
    <>
      <figure className={styles.photo}>
        {/* The photo is served from object storage, outside the image optimizer */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.description} className={styles.photoImage} />
      </figure>
      <div className={`${styles.card} ${styles.empty} mt-5`}>
        <p>{photo.viewer.isOwner ? 'The roast of this photo stopped halfway.' : 'This photo has no captions yet.'}</p>
        {photo.viewer.isOwner && (
          <button type="button" className={styles.button} disabled={isWorking} onClick={onWriteCaptions}>
            {isWorking ? 'Writing the roasts' : 'Write the roasts'}
          </button>
        )}
      </div>
    </>
  );
}
