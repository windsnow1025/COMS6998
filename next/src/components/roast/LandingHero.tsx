import * as React from 'react';
import Link from 'next/link';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import TheaterComedyRoundedIcon from '@mui/icons-material/TheaterComedyRounded';
import {useRoast} from './RoastContext';
import styles from './roast.module.css';

interface LandingHeroProps {
  // The ways on from the hero, which the page composes
  actions: React.ReactNode;
  // Shown beside the pitch on a wide page
  aside?: React.ReactNode;
}

// What the product is, in one screen: the pitch, the ways on, and what sets the game apart
export default function LandingHero({ actions, aside }: LandingHeroProps) {
  const { paths } = useRoast();

  return (
    <section className={aside ? styles.heroSplit : styles.hero} aria-labelledby="hero-title">
      <div>
        <p className={styles.eyebrow}>Columbia&apos;s daily caption game</p>
        <h1 id="hero-title" className={styles.heroTitle}>
          AI writes the captions. <span className={styles.heroAccent}>You pick the funniest.</span>
        </h1>
        <p className={styles.heroText}>
          5 new photos every day, 3 AI-written captions each. Vote blind, then see who wrote what and whether the
          crowd agrees. Got a photo?{' '}
          <Link href={paths.roast} className={styles.link}>Upload it</Link> for the next batch.
        </p>
        <div className={styles.heroActions}>{actions}</div>
        <ul className={styles.heroFacts}>
          <li>
            <BoltRoundedIcon sx={{ fontSize: 18 }} />1 tap per photo
          </li>
          <li>
            <ScheduleRoundedIcon sx={{ fontSize: 18 }} />A new batch at midnight
          </li>
          <li>
            <TheaterComedyRoundedIcon sx={{ fontSize: 18 }} />5 comedic voices
          </li>
        </ul>
      </div>
      {aside}
    </section>
  );
}
