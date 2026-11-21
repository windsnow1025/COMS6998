import * as React from 'react';
import styles from './roast.module.css';

interface LandingHeroProps {
  // The ways on from the hero, which the page composes
  actions: React.ReactNode;
  // Shown beside the pitch on a wide page
  aside?: React.ReactNode;
}

// What the product is, in one screen: the pitch, the ways on, and what sets the game apart
export default function LandingHero({ actions, aside }: LandingHeroProps) {
  return (
    <section className={aside ? styles.heroSplit : styles.hero} aria-labelledby="hero-title">
      <div>
        <p className={styles.eyebrow}>Columbia&apos;s daily caption game</p>
        <h1 id="hero-title" className={styles.heroTitle}>
          AI writes the captions. <span className={styles.heroAccent}>You pick the funniest.</span>
        </h1>
        <div className={styles.heroActions}>{actions}</div>
      </div>
      {aside}
    </section>
  );
}
