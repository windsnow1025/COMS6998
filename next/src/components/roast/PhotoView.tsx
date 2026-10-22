import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {getWinner} from '@/lib/roast/PhotoResults';
import {share} from '@/lib/roast/Share';
import {PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import PhotoCard from './PhotoCard';
import KeepPicker from './KeepPicker';
import DeletePhotoDialog from './DeletePhotoDialog';
import {LoadError, Loading} from './Status';
import styles from './roast.module.css';

interface PhotoViewProps {
  // The photo's id; undefined until the router knows the route's query
  id: string | undefined;
}

// One photo on its own page, which is the link that people share. For its uploader, the photo's drafts
// stay open until a batch serves it: the 3 kept captions can change, and a photo without them gets them here.
export default function PhotoView({ id }: PhotoViewProps) {
  const { viewer, viewerLoaded, paths, notify } = useRoast();
  const router = useRouter();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const key = viewerLoaded && id ? `photo:${id}:${viewer?.id ?? ''}` : null;
  const loadPhoto = React.useCallback(() => roastLogic.fetchPhoto(id!), [roastLogic, id]);
  const { data: photo, error: loadError, reload, setData: setPhoto } = useLoad(key, loadPhoto);

  const [isWorking, setIsWorking] = React.useState(false);
  const [isChoosing, setIsChoosing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  if (loadError) {
    return <LoadError message={loadError} onRetry={reload} />;
  }
  if (!photo) {
    return <Loading />;
  }

  const handleShare = async () => {
    const winner = photo.revealed ? getWinner(photo) : undefined;
    const result = await share({
      title: 'Daily Roast',
      text: winner ? `“${winner.content}”` : 'Which roast wins this photo?',
      url: `${window.location.origin}${paths.photo(photo.id)}`,
    });
    if (result === 'copied') {
      notify('Link copied.');
    }
  };

  const handleWriteDrafts = async () => {
    setIsWorking(true);
    setError('');
    try {
      setPhoto(await roastLogic.writeDrafts(photo.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleKept = (kept: PhotoResDto) => {
    setPhoto(kept);
    setIsChoosing(false);
  };

  const hasDrafts = photo.drafts !== undefined;
  // The drafts are written and none is kept yet
  const isUnkept = hasDrafts && photo.captions.length === 0;

  return (
    <>
      {isUnkept && (
        <>
          <h1 className={`${styles.title} ${styles.photoTitle}`}>Pick your 3</h1>
          <PhotoImage photo={photo} />
          <KeepPicker photo={photo} onKept={handleKept} />
        </>
      )}
      {!isUnkept && photo.captions.length > 0 && (
        <>
          <h1 className={`${styles.title} ${styles.photoTitle}`}>
            {photo.revealed ? 'The verdict' : 'Which roast wins?'}
          </h1>
          {isChoosing ? (
            <>
              <PhotoImage photo={photo} />
              <KeepPicker photo={photo} onKept={handleKept} onCancel={() => setIsChoosing(false)} />
            </>
          ) : (
            <PhotoCard photo={photo} onVoted={setPhoto} />
          )}
        </>
      )}
      {!hasDrafts && photo.captions.length === 0 && (
        <UncaptionedPhoto photo={photo} isWorking={isWorking} onWriteDrafts={handleWriteDrafts} />
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
        {!photo.batchDate && photo.queuePosition === undefined && isUnkept && 'In line for a batch once you keep 3.'}
        {!photo.batchDate && photo.queuePosition === undefined && !isUnkept && 'Waiting in line for a batch.'}
      </p>

      <div className={`${styles.actions} mt-3`}>
        <button type="button" className={styles.buttonGhost} onClick={handleShare}>
          <IosShareRoundedIcon fontSize="small" />
          Share
        </button>
        {hasDrafts && !isUnkept && !isChoosing && (
          <button type="button" className={styles.buttonGhost} onClick={() => setIsChoosing(true)}>
            <EditRoundedIcon fontSize="small" />
            Change my 3
          </button>
        )}
        {photo.viewer.isOwner && (
          <button type="button" className={styles.buttonGhost} onClick={() => setDeleteId(photo.id)}>
            <DeleteOutlineRoundedIcon fontSize="small" />
            Delete
          </button>
        )}
      </div>

      <DeletePhotoDialog
        photoId={deleteId}
        onClose={() => setDeleteId(null)}
        onDeleted={() => router.push(paths.me)}
      />
    </>
  );
}

function PhotoImage({ photo }: { photo: PhotoResDto }) {
  return (
    <figure className={styles.photo}>
      {/* The photo is served from object storage, outside the image optimizer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.description} className={styles.photoImage} />
    </figure>
  );
}

interface UncaptionedPhotoProps {
  photo: PhotoResDto;
  isWorking: boolean;
  onWriteDrafts: () => void;
}

// A photo whose captions were never written: its uploader left, or the LLM failed, between the two steps
function UncaptionedPhoto({ photo, isWorking, onWriteDrafts }: UncaptionedPhotoProps) {
  return (
    <>
      <PhotoImage photo={photo} />
      <div className={`${styles.card} ${styles.empty} mt-5`}>
        <p>{photo.viewer.isOwner ? 'The roast of this photo stopped halfway.' : 'This photo has no captions yet.'}</p>
        {photo.viewer.isOwner && (
          <button type="button" className={styles.button} disabled={isWorking} onClick={onWriteDrafts}>
            {isWorking ? 'Writing the roasts' : 'Write the roasts'}
          </button>
        )}
      </div>
    </>
  );
}
