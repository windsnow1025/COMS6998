import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import AddAPhotoRoundedIcon from '@mui/icons-material/AddAPhotoRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {RoastError} from '@/lib/roast/RoastError';
import {preparePhoto} from '@/lib/roast/PhotoUpload';
import {PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import PhotoCard from './PhotoCard';
import KeepPicker from './KeepPicker';
import DeletePhotoDialog from './DeletePhotoDialog';
import {Loading} from './Status';
import styles from './roast.module.css';

// The API's limit on the note about where a photo was taken
const MaxPlaceLength = 80;
const Unauthorized = 401;

// "pick": choosing a photo. "screening": the photo uploads and the LLM screens and describes it.
// "writing": the LLM writes a draft in each voice. "choosing": the uploader keeps 3 drafts. "done": the photo is published with its kept captions.
type Stage = 'pick' | 'screening' | 'writing' | 'choosing' | 'done';

// Where a signed-in user uploads a photo, gets a caption in each voice, and keeps 3 of them for the batch
export default function RoastView() {
  const { viewer, viewerLoaded, paths } = useRoast();
  const router = useRouter();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const key = viewer ? `roast:${viewer.id}` : null;
  const loadStats = React.useCallback(() => roastLogic.fetchMyStats(), [roastLogic]);
  const stats = useLoad(key, loadStats);

  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [stage, setStage] = React.useState<Stage>('pick');
  // The uploaded photo; with the "pick" stage, a photo whose drafts failed and can be retried
  const [photo, setPhoto] = React.useState<PhotoResDto | null>(null);
  const [error, setError] = React.useState('');
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!viewerLoaded) {
    return <Loading />;
  }
  if (!viewer) {
    return (
      <div className={`${styles.card} ${styles.empty}`}>
        <h1 className={styles.title}>Roast my photo</h1>
        <Link href={paths.signIn(router.asPath)} className={styles.button}>
          Sign in to upload
        </Link>
      </div>
    );
  }

  const selectFile = (selected: File | undefined) => {
    if (!selected) {
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError('');
  };

  const startOver = () => {
    setFile(null);
    setPreviewUrl('');
    setPlace('');
    setPhoto(null);
    setError('');
    setStage('pick');
    stats.reload();
  };

  // Uploads the selected file unless a photo is already uploaded, then has a draft written in each voice.
  const roast = async () => {
    setError('');
    try {
      let uploaded = photo;
      if (!uploaded) {
        setStage('screening');
        uploaded = await roastLogic.uploadPhoto(await preparePhoto(file!), place);
        setPhoto(uploaded);
      }
      setStage('writing');
      setPhoto(await roastLogic.writeDrafts(uploaded.id, 'The captions were not written. Try again.'));
      setStage('choosing');
    } catch (err) {
      if (err instanceof RoastError && err.status === Unauthorized) {
        await router.push(paths.signIn(router.asPath));
        return;
      }
      setError((err as Error).message);
      setStage('pick');
      // A photo that the screening turned down has used a roast
      stats.reload();
    }
  };

  const deleteDialog = (
    <DeletePhotoDialog
      photoId={deleteId}
      onClose={() => setDeleteId(null)}
      onDeleted={() => {
        setDeleteId(null);
        startOver();
      }}
    />
  );

  if (stage === 'choosing' && photo) {
    return (
      <>
        <h1 className={styles.title}>Pick your 3</h1>
        <figure className={`${styles.photo} mt-5`}>
          {/* The photo is served from object storage, outside the image optimizer */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.description} className={styles.photoImage} />
        </figure>
        <KeepPicker
          photo={photo}
          onKept={(kept) => {
            setPhoto(kept);
            setStage('done');
          }}
          onCancel={photo.captions.length > 0 ? () => setStage('done') : undefined}
        />
        <div className="mt-4">
          <button type="button" className={styles.linkButton} onClick={() => setDeleteId(photo.id)}>
            Delete this photo
          </button>
        </div>
        {deleteDialog}
      </>
    );
  }

  if (stage === 'done' && photo) {
    return (
      <>
        <h1 className={styles.title}>Published.</h1>
        <p className={styles.subtitle}>
          {photo.batchDate && "In today's batch."}
          {!photo.batchDate &&
            (photo.queuePosition === 1 ? 'Next in line for a batch.' : `Number ${photo.queuePosition} in line for a batch.`)}
        </p>
        <div className="mt-5">
          <PhotoCard photo={photo} onVoted={setPhoto} />
        </div>
        <div className={`${styles.actions} mt-5`}>
          {photo.drafts && (
            <button type="button" className={styles.buttonGhost} onClick={() => setStage('choosing')}>
              Change my 3
            </button>
          )}
          <button type="button" className={styles.buttonGhost} onClick={startOver}>
            Roast another
          </button>
        </div>
        <div className="mt-4">
          <button type="button" className={styles.linkButton} onClick={() => setDeleteId(photo.id)}>
            Delete this photo
          </button>
        </div>
        {deleteDialog}
      </>
    );
  }

  const isBusy = stage === 'screening' || stage === 'writing';
  const roastsLeft = stats.data?.roastsLeft;

  return (
    <>
      <h1 className={styles.title}>Roast my photo</h1>

      <div className="mt-5">
        {previewUrl ? (
          <figure className={styles.photo}>
            {/* A local preview of the selected file */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="The photo you selected" className={styles.photoImage} />
          </figure>
        ) : (
          <button
            type="button"
            className={styles.drop}
            data-over={isDragOver}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragOver(false);
              selectFile(event.dataTransfer.files[0]);
            }}
          >
            <span className={styles.dropIcon}>
              <AddAPhotoRoundedIcon />
            </span>
            <strong>Choose a photo</strong>
            <span className={`${styles.muted} ${styles.small}`}>or drop one here</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
      </div>

      {previewUrl && !isBusy && !photo && (
        <label className={styles.field}>
          <span className={styles.label}>Where was this? (optional)</span>
          <input
            className={styles.input}
            value={place}
            maxLength={MaxPlaceLength}
            placeholder="Butler, the 1 train, Chinatown"
            onChange={(event) => setPlace(event.target.value)}
          />
        </label>
      )}

      {isBusy && (
        <ol className={styles.steps} role="status">
          <li className={styles.step} data-state={stage === 'screening' ? 'active' : 'done'}>
            <span className={styles.stepDot}>{stage !== 'screening' && <CheckRoundedIcon sx={{ fontSize: 16 }} />}</span>
            Checking your photo
          </li>
          <li className={styles.step} data-state={stage === 'writing' ? 'active' : 'todo'}>
            <span className={styles.stepDot} />
            Writing a caption in each voice, about 30 seconds
          </li>
        </ol>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      {previewUrl && !isBusy && (
        <div className={`${styles.actions} mt-5`}>
          <button type="button" className={styles.button} disabled={roastsLeft === 0 && !photo} onClick={roast}>
            {photo ? 'Write the captions again' : 'Roast it'}
          </button>
          <button type="button" className={styles.buttonGhost} onClick={startOver}>
            {photo ? 'Start over' : 'Choose another'}
          </button>
        </div>
      )}

      {roastsLeft !== undefined && !isBusy && (
        <p className={`${styles.muted} ${styles.small} mt-4`}>
          {roastsLeft === 0
            ? 'No roasts left today. You get more at midnight.'
            : `${roastsLeft} ${roastsLeft === 1 ? 'roast' : 'roasts'} left today.`}
        </p>
      )}

      {!viewer.firstName && (
        <p className={`${styles.muted} ${styles.small} mt-2`}>
          Your photos are credited to {viewer.username}.{' '}
          <Link href={paths.me} className={styles.link}>
            Add your name
          </Link>
        </p>
      )}
    </>
  );
}
