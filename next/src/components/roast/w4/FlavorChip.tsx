import * as React from 'react';
import {FlavorResDto} from '@/client/nest';
import {voiceStyle} from '@/lib/roast/VoiceStyle';
import styles from '../roast.module.css';

interface FlavorChipProps {
  flavor: FlavorResDto;
  // Shown after the name, such as a count
  suffix?: string;
}

// The voice a caption is written in, as Week 4 delivered it: the tagline as the chip's title
export default function FlavorChip({ flavor, suffix }: FlavorChipProps) {
  return (
    <span className={styles.chip} style={voiceStyle(flavor)} title={flavor.tagline}>
      {flavor.name}
      {suffix && ` ${suffix}`}
    </span>
  );
}
