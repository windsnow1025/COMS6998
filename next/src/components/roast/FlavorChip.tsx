import * as React from 'react';
import Tooltip from '@mui/material/Tooltip';
import {FlavorResDto} from '@/client/nest';
import {FontVariables} from './Fonts';
import styles from './roast.module.css';

// MUI renders the tooltip outside the product's root, so the tooltip element carries the tokens and the fonts
// itself, and the theme outranks a module class on an MUI component, so its box takes the tokens through `sx`
const TipSx = {
  maxWidth: 260,
  padding: '10px 12px',
  border: '1px solid var(--dr-line)',
  borderRadius: '12px',
  bgcolor: 'var(--dr-surface)',
  color: 'var(--dr-ink)',
  boxShadow: 'var(--dr-shadow)',
  fontFamily: 'var(--dr-font-body), system-ui, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
};

const ArrowSx = {
  color: 'var(--dr-surface)',
  '&::before': { border: '1px solid var(--dr-line)' },
};

// How long a tap keeps the explanation open
const TouchLeaveDelayMs = 5000;

interface FlavorChipProps {
  flavor: FlavorResDto;
  // Shown after the name, such as a count
  suffix?: string;
}

// The voice a caption is written in; hovering or tapping the chip explains the voice: what the chip is, then
// which voice, then how it writes
export default function FlavorChip({ flavor, suffix }: FlavorChipProps) {
  return (
    <Tooltip
      title={
        <span className={styles.voiceNote} data-flavor={flavor.slug}>
          <span className={styles.voiceNoteKind}>AI voice</span>
          <strong className={styles.voiceNoteName}>{flavor.name}</strong>
          <span>{flavor.tagline}</span>
        </span>
      }
      arrow
      describeChild
      enterTouchDelay={0}
      leaveTouchDelay={TouchLeaveDelayMs}
      slotProps={{ tooltip: { className: `${FontVariables} ${styles.tokens}`, sx: TipSx }, arrow: { sx: ArrowSx } }}
    >
      <span className={styles.chipExplained} data-flavor={flavor.slug}>
        {flavor.name}
        {suffix && ` ${suffix}`}
      </span>
    </Tooltip>
  );
}
