import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {FlavorResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import FlavorChip from './FlavorChip';
import styles from './roast.module.css';

interface IntroProps {
  // The element that "See today's batch" scrolls to
  batchRef: React.RefObject<HTMLElement | null>;
}

// What the product is, for a visitor who is not signed in: the pitch, the voices, and the way in.
export default function Intro({ batchRef }: IntroProps) {
  const { paths, notify } = useRoast();
  const router = useRouter();
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
      <div className={styles.introActions}>
        <Link href={paths.signIn(router.asPath)} className={styles.button}>
          Sign in with Google
        </Link>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => batchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          Browse today&apos;s batch
          <ArrowDownwardRoundedIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom' }} />
        </button>
      </div>
    </section>
  );
}
