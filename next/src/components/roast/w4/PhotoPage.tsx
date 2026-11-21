import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {PhotoPreview} from '@/lib/roast/PhotoPreview';
import {createRoastPaths} from '@/lib/roast/RoastPaths';
import RoastShell from './RoastShell';
import styles from './roast.module.css';

interface PhotoPageProps {
  // The week's base path, under which the page lives
  base: string;
  // The icon of the product's mark in the header
  brandMark: React.ReactNode;
  // The viewer's avatar in the header, the week's `AccountLink` or `AccountMenu`
  account: React.ReactNode;
  // Null when no photo has the route's id, which shows the way back to today's batch
  preview: PhotoPreview | null;
  // The week's view of the photo, which the page composes; shown while a photo has the route's id
  children: React.ReactNode;
}

// A photo's page: the tags a link preview reads, and the photo with its captions
export default function PhotoPage({ base, brandMark, account, preview, children }: PhotoPageProps) {
  if (!preview) {
    return (
      <RoastShell base={base} brandMark={brandMark} account={account} active={null}>
        <Head>
          <title>Photo not found | Daily Roast</title>
        </Head>
        <div className={`${styles.card} ${styles.empty}`}>
          <h1 className={styles.title}>This photo is gone.</h1>
          <p className={styles.subtitle}>It may have been deleted, or the link is wrong.</p>
          <Link href={createRoastPaths(base).today} className={`${styles.button} mt-5`}>
            Today&apos;s batch
          </Link>
        </div>
      </RoastShell>
    );
  }

  return (
    <RoastShell base={base} brandMark={brandMark} account={account} active={null}>
      <Head>
        <title>{`${preview.title} | Daily Roast`}</title>
        <meta name="description" content={preview.description} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Daily Roast" />
        <meta property="og:title" content={preview.title} />
        <meta property="og:description" content="AI roasted this photo. Pick the funniest caption on Daily Roast." />
        <meta property="og:image" content={preview.imageUrl} />
        <meta property="og:url" content={preview.pageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      {children}
    </RoastShell>
  );
}
