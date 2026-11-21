import * as React from 'react';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import {formatPercent, getPickShare} from '@/lib/roast/PhotoResults';
import {PhotoCaptionResDto, PhotoResDto} from '@/client/nest';
import FlavorChip from './FlavorChip';
import styles from './roast.module.css';

interface RevealedOptionProps {
  photo: PhotoResDto;
  caption: PhotoCaptionResDto;
  // Whether the caption has the most picks of the photo
  isWinner: boolean;
  // The voice's chip without its explanation: an option inside a link
  plainVoice?: boolean;
}

// A caption of a revealed photo: its share of the picks as a bar, its voice, and its standing
export default function RevealedOption({ photo, caption, isWinner, plainVoice = false }: RevealedOptionProps) {
  const isPicked = photo.viewer.captionId === caption.id;
  const share = formatPercent(getPickShare(photo, caption));
  // A photo that nobody has voted on has no shares to show
  const hasVotes = (photo.voters ?? 0) > 0;

  return (
    <div className={styles.option} data-picked={isPicked} data-winner={isWinner}>
      <span className={styles.optionBar} style={{ '--dr-share': share } as React.CSSProperties} />
      <div className={styles.optionBody}>
        <div className={styles.optionText}>{caption.content}</div>
        <div className={styles.optionMeta}>
          {caption.flavor && <FlavorChip flavor={caption.flavor} plain={plainVoice} />}
          {isPicked && <span className={styles.tag}>Your pick</span>}
          {isWinner && (
            <span className={styles.crown} role="img" aria-label="Most picked">
              <EmojiEventsRoundedIcon fontSize="small" />
            </span>
          )}
          {hasVotes && <span className={styles.optionShare}>{share}</span>}
        </div>
      </div>
    </div>
  );
}
