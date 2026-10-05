import * as React from 'react';
import {FlavorResDto} from '@/client/nest';
import styles from './roast.module.css';

interface FlavorChipProps {
  flavor: FlavorResDto;
  // Shown after the name, such as a count
  suffix?: string;
}

// The voice a caption is written in
export default function FlavorChip({ flavor, suffix }: FlavorChipProps) {
  return (
    <span className={styles.chip} data-flavor={flavor.slug} title={flavor.tagline}>
      {flavor.name}
      {suffix && ` ${suffix}`}
    </span>
  );
}
