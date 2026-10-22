import * as React from 'react';
import Link from 'next/link';
import GoogleSignInButton from '@/components/common/components/GoogleSignInButton';
import {useRoast} from '../RoastContext';
import Intro from './Intro';
import styles from '../roast.module.css';

// The about page as Week 5 delivered it: the introduction on its own page, for a viewer who has signed in past the home page's
export default function AboutView() {
  const { viewer, viewerLoaded, paths } = useRoast();

  return (
    <Intro
      actions={
        viewerLoaded && (
          <>
            {!viewer && (
              <div className={styles.introSignIn}>
                <GoogleSignInButton />
              </div>
            )}
            <Link href={paths.today} className={viewer ? styles.button : styles.linkButton}>
              Today&apos;s batch
            </Link>
          </>
        )
      }
    />
  );
}
