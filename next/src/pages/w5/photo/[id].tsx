import React from "react";
import type {GetServerSideProps, InferGetServerSidePropsType} from "next";
import PhotoPage from "@/components/roast/PhotoPage";
import {fetchPhotoPreview, PhotoPreview} from "@/lib/roast/PhotoPreview";
import {W5Base} from "@/lib/roast/Weeks";

export const getServerSideProps = (async ({params}) => {
  const preview = await fetchPhotoPreview(W5Base, params!.id as string);
  return preview ? {props: {preview}} : {notFound: true};
}) satisfies GetServerSideProps<{preview: PhotoPreview}>;

function W5PhotoPage({preview}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <PhotoPage base={W5Base} preview={preview}/>;
}

export default W5PhotoPage;
