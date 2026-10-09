import * as React from 'react';
import Link from 'next/link';
import RoastLogic from '@/lib/roast/RoastLogic';
import {FlavorResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import FlavorChip from './FlavorChip';
import styles from './roast.module.css';

interface IntroProps {
  // The ways on from the introduction, which the page composes
  actions: React.ReactNode;
}

// What the product is: the pitch and the voices, with the page's ways on below them
export default function Intro({ actions }: IntroProps) {
  const { paths, notify } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);
  const [flavors, setFlavors] = React.useState<FlavorResDto[]>([]);

  React.useEffect(() => {
    roastLogic.fetchFlavors().then(setFlavors, (error: Error) => notify(error.message));
  }, [roastLogic, notify]);

  return (
    <section className={styles.intro} aria-labelledby="intro-title">
      <p className={styles.eyebrow}>Columbia&apos;s daily caption game</p>
      <h1 id="intro-title" className={styles.introTitle}>
        AI writes the captions. You pick the funniest.
      </h1>
      <p className={styles.introText}>
        Every day, 5 photos from campus and the city get 3 AI-written captions each, in 3 of these 5 voices.
        Pick the funniest, then see which voice wrote what, what the crowd picked, and your streak.
        Got a photo?{' '}
        <Link href={paths.roast} className={styles.link}>Upload it</Link>
        {' '}and the AI roasts it for the next batch.
      </p>
      {flavors.length > 0 && (
        <ul className={styles.voiceList} aria-label="The voices">
          {flavors.map((flavor) => (
            <li key={flavor.slug} className={styles.voiceItem}>
              <FlavorChip flavor={flavor} />
              <span className={`${styles.muted} ${styles.small}`}>{flavor.tagline}</span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.introActions}>{actions}</div>
    </section>
  );
}
