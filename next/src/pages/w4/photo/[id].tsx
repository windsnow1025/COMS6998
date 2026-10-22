import React from "react";
import type {GetServerSideProps, InferGetServerSidePropsType} from "next";
import AccountLink from "@/components/roast/AccountLink";
import {CafeMark} from "@/components/roast/BrandMarks";
import PhotoPage from "@/components/roast/PhotoPage";
import PhotoView from "@/components/roast/w4/PhotoView";
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
  return (
    <PhotoPage base={W4Base} brandMark={CafeMark} account={<AccountLink/>} preview={preview}>
      {preview && <PhotoView id={preview.id}/>}
    </PhotoPage>
  );
}

export default W4PhotoPage;
