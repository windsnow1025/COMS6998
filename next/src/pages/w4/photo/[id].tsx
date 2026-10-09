import React from "react";
import type {GetServerSideProps, InferGetServerSidePropsType} from "next";
import {CafeMark} from "@/components/roast/BrandMarks";
import PhotoPage from "@/components/roast/PhotoPage";
import {fetchPhotoPreview, PhotoPreview} from "@/lib/roast/PhotoPreview";
import {W4Base} from "@/lib/roast/Weeks";

export const getServerSideProps = (async ({params, res}) => {
  const preview = await fetchPhotoPreview(W4Base, params!.id as string);
  if (!preview) {
    res.statusCode = 404;
  }
  return {props: {preview}};
}) satisfies GetServerSideProps<{preview: PhotoPreview | null}>;

function W4PhotoPage({preview}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <PhotoPage base={W4Base} brandMark={CafeMark} preview={preview}/>;
}

export default W4PhotoPage;
