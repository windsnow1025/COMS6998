import * as React from 'react';
import {useRouter} from 'next/router';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {RoastError} from '@/lib/roast/RoastError';
import {formatPercent, getNoneShare, getOutcome, getWinner, hasVerdict, isTied, type Outcome as OutcomeTone} from '@/lib/roast/PhotoResults';
import {PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import RevealedOption from './RevealedOption';
import styles from './roast.module.css';

const Unauthorized = 401;
const Conflict = 409;
const VerdictIconSx = { fontSize: 18 };

interface PhotoCardProps {
  photo: PhotoResDto;
  // Receives the photo as it stands after the viewer's vote
  onVoted: (photo: PhotoResDto) => void;
  // Shows the tap hint above the options: the first photo a viewer who has yet to vote can pick on
  showHint?: boolean;
}

// A photo with its captions: options to pick from while its results are hidden, and the results once revealed.
export default function PhotoCard({ photo, onVoted, showHint = false }: PhotoCardProps) {
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

  // The crown marks the verdict, so a lone leader among too few voters has none yet
  const winnerId = hasVerdict(photo) ? getWinner(photo)?.id : undefined;

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

      {showHint && !photo.revealed && (
        <p className={styles.tapHint}>
          <TouchAppRoundedIcon sx={{ fontSize: 18 }} />
          Tap the funniest caption
        </p>
      )}
      <ol className={styles.options}>
        {photo.captions.map((caption) => (
          <li key={caption.id}>
            {photo.revealed ? (
              <RevealedOption photo={photo} caption={caption} isWinner={caption.id === winnerId} />
            ) : (
              <button type="button" className={styles.option} disabled={isVoting} onClick={() => vote(caption.id)}>
                <div className={`${styles.optionBody} ${styles.optionChoice}`}>
                  <span className={styles.optionMark} aria-hidden="true" />
                  <div className={styles.optionText}>{caption.content}</div>
                </div>
              </button>
            )}
          </li>
        ))}
        {!photo.revealed && (
          <li>
            <button
              type="button"
              className={`${styles.option} ${styles.noneOption}`}
              disabled={isVoting}
              onClick={() => vote(null)}
            >
              <div className={`${styles.optionBody} ${styles.optionChoice}`}>
                <span className={styles.optionMark} aria-hidden="true" />
                <div className={styles.optionText}>None of these is funny</div>
              </div>
            </button>
          </li>
        )}
      </ol>
      {error && <p className={styles.error}>{error}</p>}
      {photo.revealed && <Outcome photo={photo} />}
    </article>
  );
}

function Outcome({ photo }: { photo: PhotoResDto }) {
  const voters = photo.voters ?? 0;
  // A non-breaking space keeps the count and its word on one line
  const votes = `${voters}\u00A0${voters === 1 ? 'vote' : 'votes'}`;
  const noneShare = getNoneShare(photo);
  const none = noneShare > 0 ? ` ${formatPercent(noneShare)} picked none.` : '';
  // A tie at the top is never broken: the photo goes back into a batch until a vote breaks it
  const tie = isTied(photo) ? ' The top captions are tied.' : '';

  if (!photo.viewer.isOwner && !photo.viewer.hasVoted) {
    return (
      <Verdict icon={<BarChartRoundedIcon sx={VerdictIconSx} />}>
        {votes}.{tie}{none}
      </Verdict>
    );
  }

  const outcome = getOutcome(photo);
  // The viewer is one of the none picks, so the others are the rest
  const othersNone = (photo.nonePicks ?? 0) - 1;
  const text = {
    // The owner's line states that the photo is published wherever the owner meets the card; before a batch serves
    // the photo, there is no vote to count
    owner: photo.batchDate ? `Published. ${votes} so far.${tie}${none}` : 'Published. Voting starts when your photo is in a batch.',
    match: `You picked the crowd favorite. ${votes}.${none}`,
    miss: `Hot take. The crowd went another way. ${votes}.${none}`,
    early: isTied(photo)
      ? `${votes} so far, tied at the top. No verdict until a vote breaks the tie.`
      : `${votes} so far. Too few for a verdict yet.`,
    none: voters === 1
      ? 'You picked none. You are the first to vote.'
      : othersNone === 0
        ? 'You picked none. Nobody else has yet.'
        : `You picked none. ${othersNone} of the other ${voters - 1} voters did too.`,
  }[outcome];
  const icon = {
    owner: <PublicRoundedIcon sx={VerdictIconSx} />,
    match: <CheckCircleRoundedIcon sx={VerdictIconSx} />,
    miss: <BoltRoundedIcon sx={VerdictIconSx} />,
    early: <HourglassTopRoundedIcon sx={VerdictIconSx} />,
    none: <RemoveCircleOutlineRoundedIcon sx={VerdictIconSx} />,
  }[outcome];

  return (
    <Verdict icon={icon} tone={outcome}>
      {text}
    </Verdict>
  );
}

interface VerdictProps {
  icon: React.ReactNode;
  tone?: OutcomeTone;
  children: React.ReactNode;
}

// The line under a revealed card's options: a note with an icon, read as a remark on the options above it and not
// as a fourth row
function Verdict({ icon, tone, children }: VerdictProps) {
  return (
    <p className={styles.verdict} data-tone={tone}>
      <span className={styles.verdictIcon} aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </p>
  );
}
