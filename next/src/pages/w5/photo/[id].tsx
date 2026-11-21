import React from "react";
import type {GetServerSideProps, InferGetServerSidePropsType} from "next";
import AccountMenu from "@/components/roast/w5/AccountMenu";
import {FlameMark} from "@/components/roast/BrandMarks";
import PhotoPage from "@/components/roast/w5/PhotoPage";
import PhotoView from "@/components/roast/w5/PhotoView";
import {fetchPhotoPreview, PhotoPreview} from "@/lib/roast/PhotoPreview";
import {W5Base} from "@/lib/roast/Weeks";

export const getServerSideProps = (async ({params, res}) => {
  const preview = await fetchPhotoPreview(W5Base, params!.id as string, "Which roast wins this photo?");
  if (!preview) {
    res.statusCode = 404;
  }
  return {props: {preview}};
}) satisfies GetServerSideProps<{preview: PhotoPreview | null}>;

function W5PhotoPage({preview}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <PhotoPage base={W5Base} brandMark={FlameMark} account={<AccountMenu/>} preview={preview}>
      {preview && <PhotoView id={preview.id}/>}
    </PhotoPage>
  );
}

export default W5PhotoPage;
