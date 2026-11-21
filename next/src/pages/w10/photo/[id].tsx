import React from "react";
import type {GetServerSideProps, InferGetServerSidePropsType} from "next";
import AccountMenu from "@/components/roast/AccountMenu";
import {FlameMark} from "@/components/roast/BrandMarks";
import PhotoPage from "@/components/roast/PhotoPage";
import PhotoView from "@/components/roast/PhotoView";
import {fetchPhotoPreview, PhotoPreview} from "@/lib/roast/PhotoPreview";
import {W10Base} from "@/lib/roast/Weeks";

export const getServerSideProps = (async ({params, res}) => {
  const preview = await fetchPhotoPreview(W10Base, params!.id as string, "Which caption wins this photo?");
  if (!preview) {
    res.statusCode = 404;
  }
  return {props: {preview}};
}) satisfies GetServerSideProps<{preview: PhotoPreview | null}>;

function W10PhotoPage({preview}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <PhotoPage base={W10Base} brandMark={FlameMark} account={<AccountMenu/>} preview={preview}>
      {preview && <PhotoView id={preview.id}/>}
    </PhotoPage>
  );
}

export default W10PhotoPage;
