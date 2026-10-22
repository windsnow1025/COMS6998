import * as React from 'react';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {getWinner} from '@/lib/roast/PhotoResults';
import {PhotoResDto} from '@/client/nest';
import {describeStanding} from './PickStanding';
import styles from './roast.module.css';

interface JudgedRowProps {
  photo: PhotoResDto;
  // Whether the full card is open under the row
  expanded: boolean;
  // Opens or folds the full card
  onToggle: () => void;
}

// A photo the viewer had judged before the page loaded, folded to one row in its place in the feed:
// the thumbnail, what the viewer picked, and where the vote stands. The row is the handle of the full card,
// which a tap opens under it and another tap folds away.
export default function JudgedRow({ photo, expanded, onToggle }: JudgedRowProps) {
  const pick = photo.captions.find(({ id }) => id === photo.viewer.captionId);
  const text =
    !photo.viewer.isOwner && photo.viewer.captionId === null
      ? 'None of these is funny'
      : (pick ?? getWinner(photo) ?? photo.captions.at(0))?.content;
  const Chevron = expanded ? ExpandLessRoundedIcon : ExpandMoreRoundedIcon;

  return (
    <button type="button" className={`${styles.thumbRow} ${styles.judgedRow}`} onClick={onToggle} aria-expanded={expanded}>
      {/* The photo is served from object storage, outside the image optimizer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.description} className={styles.thumb} loading="lazy" />
      <div className={styles.thumbBody}>
        <p className={styles.thumbCaption}>{text}</p>
        <div className={`${styles.muted} ${styles.small}`}>{describeStanding(photo)}</div>
      </div>
      <Chevron className={styles.judgedExpand} />
    </button>
  );
}
