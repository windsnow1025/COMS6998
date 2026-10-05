import React from "react";
import type {GetServerSideProps, InferGetServerSidePropsType} from "next";
import Head from "next/head";
import RoastShell from "@/components/roast/RoastShell";
import PhotoView from "@/components/roast/PhotoView";
import {getBaseUrl} from "@/lib/common/Constants";
import {getServerNestBaseUrl} from "@/lib/roast/ServerApi";
import {getWinners} from "@/lib/roast/PhotoResults";
import {createRoastPaths} from "@/lib/roast/RoastPaths";
import {W4Base} from "@/lib/roast/Weeks";
import {PhotoResDto} from "@/client/nest";

// What a link preview shows of the photo, as an anonymous viewer sees it
interface PhotoPreview {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
}

const NotFoundStatuses = [400, 404];

export const getServerSideProps = (async ({params}) => {
  const id = params!.id as string;
  const response = await fetch(`${getServerNestBaseUrl()}/images/${encodeURIComponent(id)}`);
  if (NotFoundStatuses.includes(response.status)) {
    return {notFound: true};
  }
  if (!response.ok) {
    throw new Error(`The photo request answered ${response.status}`);
  }

  const photo: PhotoResDto = await response.json();
  const winner = photo.revealed ? getWinners(photo).at(0) : undefined;
  return {
    props: {
      preview: {
        id,
        title: winner ? `“${winner.content}”` : "Which roast wins this photo?",
        description: photo.description,
        imageUrl: photo.url,
        pageUrl: `${getBaseUrl()}${createRoastPaths(W4Base).photo(id)}`,
      },
    },
  };
}) satisfies GetServerSideProps<{preview: PhotoPreview}>;

function PhotoPage({preview}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <RoastShell base={W4Base} active={null}>
      <Head>
        <title>{`${preview.title} | Daily Roast`}</title>
        <meta name="description" content={preview.description}/>
        <meta property="og:type" content="article"/>
        <meta property="og:site_name" content="Daily Roast"/>
        <meta property="og:title" content={preview.title}/>
        <meta property="og:description" content="AI roasted this photo. Pick the funniest caption on Daily Roast."/>
        <meta property="og:image" content={preview.imageUrl}/>
        <meta property="og:url" content={preview.pageUrl}/>
        <meta name="twitter:card" content="summary_large_image"/>
      </Head>
      <PhotoView id={preview.id}/>
    </RoastShell>
  );
}

export default PhotoPage;
