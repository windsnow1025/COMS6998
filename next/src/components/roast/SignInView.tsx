import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import GoogleSignInButton from '@/components/common/components/GoogleSignInButton';
import {useRoast} from './RoastContext';
import styles from './roast.module.css';

// Sign-in with Google. The button returns the user to the `redirect` of the query.
export default function SignInView() {
  const { viewer, paths } = useRoast();
  const router = useRouter();

  // A signed-in visitor has nothing to do here
  React.useEffect(() => {
    if (viewer) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      void router.replace(redirect?.startsWith('/') ? redirect : paths.today);
    }
  }, [viewer, router, paths]);

  return (
    <div className={styles.signIn}>
      <span className={`${styles.brandMark} mx-auto`}>
        <LocalCafeRoundedIcon fontSize="small" />
      </span>
      <h1 className={styles.title}>Sign in to Daily Roast</h1>
      <p className={styles.subtitle}>
        Vote on the daily batch, keep your streak, and get your own photos roasted.
      </p>
      <div className={styles.signInButton}>
        <GoogleSignInButton />
      </div>
      <p className={`${styles.muted} ${styles.small} mt-5`}>
        By continuing you agree to the{' '}
        <Link href="/about/terms" className={styles.link}>Terms</Link>
        {' '}and the{' '}
        <Link href="/about/privacy" className={styles.link}>Privacy Policy</Link>.
      </p>
    </div>
  );
}
