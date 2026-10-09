import * as React from 'react';
import {useRouter} from 'next/router';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {RoastError} from '@/lib/roast/RoastError';
import {formatPercent, getNoneShare, getOutcome, getPickShare, getWinners} from '@/lib/roast/PhotoResults';
import {PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import FlavorChip from './FlavorChip';
import styles from './roast.module.css';

const Unauthorized = 401;
const Conflict = 409;

interface PhotoCardProps {
  photo: PhotoResDto;
  // Receives the photo as it stands after the viewer's vote
  onVoted: (photo: PhotoResDto) => void;
}

// A photo with its captions: options to pick from while its results are hidden, and the results once revealed.
export default function PhotoCard({ photo, onVoted }: PhotoCardProps) {
  const { viewer, paths } = useRoast();
  const router = useRouter();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const [isVoting, setIsVoting] = React.useState(false);
  const [error, setError] = React.useState('');

  const vote = async (captionId: string | null) => {
    if (!viewer) {
      await router.push(paths.signIn(router.asPath));
      return;
    }

    setIsVoting(true);
    setError('');
    try {
      onVoted(await roastLogic.vote(photo.id, captionId));
    } catch (err) {
      const status = err instanceof RoastError ? err.status : undefined;
      if (status === Unauthorized) {
        await router.push(paths.signIn(router.asPath));
      } else if (status === Conflict) {
        // The vote already stands, cast in another tab or on another device
        onVoted(await roastLogic.fetchPhoto(photo.id));
      } else {
        setError((err as Error).message);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const winnerIds = getWinners(photo).map(({ id }) => id);
  // A photo that nobody has voted on has no shares to show
  const hasVotes = (photo.voters ?? 0) > 0;

  return (
    <article>
      <figure className={styles.photo}>
        {/* The photo is served from object storage, outside the image optimizer */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.description} className={styles.photoImage} />
        <figcaption className={styles.photoMeta}>
          {photo.place && (
            <span className={styles.pill}>
              <PlaceRoundedIcon sx={{ fontSize: 16 }} />
              {photo.place}
            </span>
          )}
          {photo.uploader && (
            <span className={styles.pill}>
              {photo.viewer.isOwner ? 'Your photo' : `by ${photo.uploader.name}`}
            </span>
          )}
        </figcaption>
      </figure>

      {!photo.revealed && (
        <p className={styles.prompt}>
          Which caption is funniest?
          {!viewer && <span className={styles.muted}> Sign in to vote.</span>}
        </p>
      )}

      <ol className={styles.options}>
        {photo.captions.map((caption) => (
          <li key={caption.id}>
            {photo.revealed ? (
              <div
                className={styles.option}
                data-picked={photo.viewer.captionId === caption.id}
                data-winner={winnerIds.includes(caption.id)}
              >
                <span
                  className={styles.optionBar}
                  style={{ '--dr-share': formatPercent(getPickShare(photo, caption)) } as React.CSSProperties}
                />
                <div className={styles.optionBody}>
                  <div className={styles.optionText}>{caption.content}</div>
                  <div className={styles.optionMeta}>
                    {caption.flavor && <FlavorChip flavor={caption.flavor} />}
                    {photo.viewer.captionId === caption.id && <span className={styles.tag}>Your pick</span>}
                    {winnerIds.includes(caption.id) && (
                      <span className={styles.crown} title="Most picked">
                        <EmojiEventsRoundedIcon fontSize="small" />
                      </span>
                    )}
                    {hasVotes && (
                      <span className={styles.optionShare}>{formatPercent(getPickShare(photo, caption))}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" className={styles.option} disabled={isVoting} onClick={() => vote(caption.id)}>
                <div className={styles.optionBody}>
                  <div className={styles.optionText}>{caption.content}</div>
                </div>
              </button>
            )}
          </li>
        ))}
      </ol>

      {!photo.revealed && (
        <div className={styles.noneRow}>
          <button type="button" className={styles.linkButton} disabled={isVoting} onClick={() => vote(null)}>
            None of these
          </button>
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
      {photo.revealed && <Outcome photo={photo} />}
    </article>
  );
}

function Outcome({ photo }: { photo: PhotoResDto }) {
  const voters = photo.voters ?? 0;
  const votes = `${voters} ${voters === 1 ? 'vote' : 'votes'}`;
  const noneShare = getNoneShare(photo);
  const none = noneShare > 0 ? ` ${formatPercent(noneShare)} picked none.` : '';

  if (!photo.viewer.isOwner && !photo.viewer.hasVoted) {
    return <p className={styles.outcome}>{votes}.{none}</p>;
  }

  const outcome = getOutcome(photo);
  const text = {
    owner: `Your photo. ${votes} so far.${none}`,
    match: `You picked the crowd favorite. ${votes}.${none}`,
    miss: `Hot take. The crowd went another way. ${votes}.${none}`,
    early: `${votes} so far. Too few for a verdict yet.`,
    none: voters === 1
      ? 'None for you. You are the first to vote.'
      : `None for you. ${formatPercent(noneShare)} of the ${voters} voters said the same.`,
  }[outcome];

  return <p className={styles.outcome} data-tone={outcome}>{text}</p>;
}
