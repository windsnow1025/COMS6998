import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import AddAPhotoRoundedIcon from '@mui/icons-material/AddAPhotoRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {RoastError} from '@/lib/roast/RoastError';
import {preparePhoto} from '@/lib/roast/PhotoUpload';
import {share} from '@/lib/roast/Share';
import {PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import PhotoCard from './PhotoCard';
import {Loading} from './Status';
import styles from './roast.module.css';

// The API's limit on the note about where a photo was taken
const MaxPlaceLength = 80;
const Unauthorized = 401;

// "pick": choosing a photo. "screening": the photo uploads and the LLM screens and describes it.
// "writing": the LLM writes the captions. "done": the captions are shown.
type Stage = 'pick' | 'screening' | 'writing' | 'done';

// Where a signed-in user uploads a photo and gets it captioned
export default function RoastView() {
  const { viewer, viewerLoaded, paths, notify } = useRoast();
  const router = useRouter();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const key = viewer ? `roast:${viewer.id}` : null;
  const loadStats = React.useCallback(() => roastLogic.fetchMyStats(), [roastLogic]);
  const stats = useLoad(key, loadStats);

  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [stage, setStage] = React.useState<Stage>('pick');
  // The uploaded photo; with the "pick" stage, a photo whose captions failed and can be retried
  const [photo, setPhoto] = React.useState<PhotoResDto | null>(null);
  const [error, setError] = React.useState('');
  const [isDragOver, setIsDragOver] = React.useState(false);
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
        <p className={styles.subtitle}>Sign in to upload a photo and let AI caption it in 3 voices.</p>
        <Link href={paths.signIn(router.asPath)} className={`${styles.button} mt-5`}>
          Sign in
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

  // Uploads the selected file unless a photo is already uploaded, then has its captions written.
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
      setPhoto(await roastLogic.writeCaptions(uploaded.id));
      setStage('done');
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

  const handleShare = async (photo: PhotoResDto) => {
    const result = await share({
      title: 'Daily Roast',
      text: 'AI roasted my photo. Which caption wins?',
      url: `${window.location.origin}${paths.photo(photo.id)}`,
    });
    if (result === 'copied') {
      notify('Link copied.');
    }
  };

  if (stage === 'done' && photo) {
    return (
      <>
        <h1 className={styles.title}>Roasted.</h1>
        <p className={styles.subtitle}>
          {photo.queuePosition === 1
            ? 'Your photo is next in line for a batch. Classmates vote once it is served.'
            : `Your photo is number ${photo.queuePosition} in line for a batch. Classmates vote once it is served.`}
        </p>
        <div className="mt-5">
          <PhotoCard photo={photo} onVoted={setPhoto} />
        </div>
        <div className={`${styles.actions} mt-5`}>
          <button type="button" className={styles.button} onClick={() => handleShare(photo)}>
            Share it
          </button>
          <button type="button" className={styles.buttonGhost} onClick={startOver}>
            Roast another
          </button>
        </div>
      </>
    );
  }

  const isBusy = stage === 'screening' || stage === 'writing';
  const roastsLeft = stats.data?.roastsLeft;

  return (
    <>
      <h1 className={styles.title}>Roast my photo</h1>
      <p className={styles.subtitle}>
        Upload a photo from campus or the city. AI captions it in 3 voices, and classmates pick the winner.
      </p>

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
        <ol className={styles.steps}>
          <li className={styles.step} data-state={stage === 'screening' ? 'active' : 'done'}>
            <span className={styles.stepDot}>{stage !== 'screening' && <CheckRoundedIcon sx={{ fontSize: 16 }} />}</span>
            Looking at your photo
          </li>
          <li className={styles.step} data-state={stage === 'writing' ? 'active' : 'todo'}>
            <span className={styles.stepDot} />
            Writing the roasts
          </li>
        </ol>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {previewUrl && !isBusy && (
        <div className={`${styles.actions} mt-5`}>
          <button type="button" className={styles.button} disabled={roastsLeft === 0 && !photo} onClick={roast}>
            {photo ? 'Try the roasts again' : 'Roast it'}
          </button>
          <button type="button" className={styles.buttonGhost} onClick={startOver}>
            {photo ? 'Start over' : 'Choose another'}
          </button>
        </div>
      )}

      {roastsLeft !== undefined && !isBusy && (
        <p className={`${styles.muted} ${styles.small} mt-4`}>
          {roastsLeft === 0
            ? 'You have used your roasts for today. Come back tomorrow.'
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
