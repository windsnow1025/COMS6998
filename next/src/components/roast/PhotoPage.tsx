import * as React from 'react';
import Head from 'next/head';
import {PhotoPreview} from '@/lib/roast/PhotoPreview';
import RoastShell from './RoastShell';
import PhotoView from './PhotoView';

interface PhotoPageProps {
  // The week's base path, under which the page lives
  base: string;
  preview: PhotoPreview;
}

// A photo's page: the tags a link preview reads, and the photo with its captions
export default function PhotoPage({ base, preview }: PhotoPageProps) {
  return (
    <RoastShell base={base} active={null}>
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
      <PhotoView id={preview.id} />
    </RoastShell>
  );
}
