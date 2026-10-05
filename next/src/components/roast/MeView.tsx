import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import UserLogic from '@/lib/common/user/UserLogic';
import FileLogic from '@/lib/common/file/FileLogic';
import RoastLogic from '@/lib/roast/RoastLogic';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {preparePhoto} from '@/lib/roast/PhotoUpload';
import {formatPercent, getWinners} from '@/lib/roast/PhotoResults';
import {PhotoResDto, StatsResDto, UserResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import {LoadError, Loading} from './Status';
import ViewerAvatar from './ViewerAvatar';
import styles from './roast.module.css';

// The viewer's own page: profile, standing, taste, and uploads
export default function MeView() {
  const { viewer, viewerLoaded, paths, signOut } = useRoast();
  const router = useRouter();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const key = viewer ? `me:${viewer.id}` : null;
  const loadStats = React.useCallback(() => roastLogic.fetchMyStats(), [roastLogic]);
  const stats = useLoad(key, loadStats);
  const loadPhotos = React.useCallback(() => roastLogic.fetchMyPhotos(), [roastLogic]);
  const photos = useLoad(key, loadPhotos);

  if (!viewerLoaded) {
    return <Loading />;
  }
  if (!viewer) {
    return (
      <div className={`${styles.card} ${styles.empty}`}>
        <h1 className={styles.title}>Your page</h1>
        <p className={styles.subtitle}>Sign in to keep a streak, see your taste, and follow your photos.</p>
        <Link href={paths.signIn(router.asPath)} className={`${styles.button} mt-5`}>
          Sign in
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    signOut();
    await router.push(paths.today);
  };

  return (
    <>
      <Profile user={viewer} />

      {stats.error && <LoadError message={stats.error} onRetry={stats.reload} />}
      {!stats.data && !stats.error && <Loading />}
      {stats.data && <Standing stats={stats.data} />}

      <h2 className={styles.sectionTitle}>Your photos</h2>
      {photos.error && <LoadError message={photos.error} onRetry={photos.reload} />}
      {!photos.data && !photos.error && <Loading />}
      {photos.data && photos.data.length === 0 && (
        <div className={`${styles.card} ${styles.empty}`}>
          <p>You have not roasted a photo yet.</p>
          <Link href={paths.roast} className={styles.button}>
            Roast my photo
          </Link>
        </div>
      )}
      {photos.data && photos.data.length > 0 && (
        <div className={styles.list}>
          {photos.data.map((photo) => (
            <MyPhoto key={photo.id} photo={photo} />
          ))}
        </div>
      )}

      <div className={`${styles.actions} mt-8`}>
        <button type="button" className={styles.buttonGhost} onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </>
  );
}

function Profile({ user }: { user: UserResDto }) {
  const { refreshViewer, notify } = useRoast();

  const [firstName, setFirstName] = React.useState(user.firstName ?? '');
  const [lastName, setLastName] = React.useState(user.lastName ?? '');
  const [isEditing, setIsEditing] = React.useState(!user.firstName || !user.lastName);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSaveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await new UserLogic().updateName(firstName.trim(), lastName.trim());
      await refreshViewer();
      setIsEditing(false);
      notify('Name saved.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatar = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const [url] = await new FileLogic().uploadFiles([await preparePhoto(file)]);
      await new UserLogic().updateAvatar(url);
      await refreshViewer();
      notify('Photo saved.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

  return (
    <section>
      <div className={styles.profile}>
        <ViewerAvatar user={user} className={styles.profileAvatar} />
        <div>
          <h1 className={styles.profileName}>{name}</h1>
          <div className={`${styles.muted} ${styles.small}`}>{user.email}</div>
        </div>
      </div>

      <div className={`${styles.actions} mt-3`}>
        <button type="button" className={styles.linkButton} disabled={isSaving} onClick={() => fileInputRef.current?.click()}>
          Change photo
        </button>
        {!isEditing && (
          <button type="button" className={styles.linkButton} onClick={() => setIsEditing(true)}>
            Edit name
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => handleAvatar(event.target.files?.[0])}
        />
      </div>

      {isEditing && (
        <form className={`${styles.card} p-4 mt-3`} onSubmit={handleSaveName}>
          {(!user.firstName || !user.lastName) && (
            <p className={styles.small}>Add your name. Your roasts are credited to it, as your first name and last initial.</p>
          )}
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>First name</span>
              <input
                className={styles.input}
                value={firstName}
                autoComplete="given-name"
                required
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Last name</span>
              <input
                className={styles.input}
                value={lastName}
                autoComplete="family-name"
                required
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>
          </div>
          <div className={`${styles.actions} mt-4`}>
            <button type="submit" className={styles.button} disabled={isSaving}>
              Save
            </button>
            {user.firstName && user.lastName && (
              <button type="button" className={styles.buttonGhost} onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}

function Standing({ stats }: { stats: StatsResDto }) {
  const totalPicks = stats.flavors.reduce((total, { picks }) => total + picks, 0);
  const flavors = [...stats.flavors].sort((a, b) => b.picks - a.picks);

  return (
    <>
      <div className={styles.statsWide}>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            <LocalFireDepartmentRoundedIcon className={styles.flame} />
            {stats.streak}
          </div>
          <div className={styles.statLabel}>day streak</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {stats.judged > 0 ? formatPercent(stats.matches / stats.judged) : '–'}
          </div>
          <div className={styles.statLabel}>with the crowd</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.votes}</div>
          <div className={styles.statLabel}>photos judged</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.picksReceived}</div>
          <div className={styles.statLabel}>picks on your photos</div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Your taste</h2>
      {totalPicks === 0 ? (
        <p className={styles.muted}>Vote on a batch to see which voices you pick.</p>
      ) : (
        <div className={styles.voices}>
          {flavors.map(({ flavor, picks }) => (
            <div key={flavor.slug} className={styles.voice} data-flavor={flavor.slug}>
              <div className={styles.voiceHead}>
                <span>{flavor.name}</span>
                <span>{formatPercent(picks / totalPicks)}</span>
              </div>
              <div className={styles.voiceTagline}>{flavor.tagline}</div>
              <div className={styles.voiceTrack}>
                <div
                  className={styles.voiceFill}
                  style={{ '--dr-share': formatPercent(picks / totalPicks) } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function MyPhoto({ photo }: { photo: PhotoResDto }) {
  const { paths } = useRoast();
  const caption = getWinners(photo).at(0) ?? photo.captions.at(0);
  const votes = `${photo.voters} ${photo.voters === 1 ? 'vote' : 'votes'}`;

  return (
    <Link href={paths.photo(photo.id)} className={styles.thumbRow}>
      {/* The photo is served from object storage, outside the image optimizer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.description} className={styles.thumb} loading="lazy" />
      <div className={styles.thumbBody}>
        <p className={styles.thumbCaption}>{caption ? caption.content : 'The roast stopped halfway.'}</p>
        <div className={`${styles.muted} ${styles.small}`}>
          {photo.batchDate
            ? `Batch of ${formatCampusDate(photo.batchDate)} · ${votes}`
            : `Number ${photo.queuePosition} in line`}
        </div>
      </div>
    </Link>
  );
}
