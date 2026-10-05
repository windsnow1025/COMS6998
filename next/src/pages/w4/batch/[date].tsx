import React from "react";
import Head from "next/head";
import {useRouter} from "next/router";
import RoastShell from "@/components/roast/RoastShell";
import BatchView from "@/components/roast/BatchView";
import {W4Base} from "@/lib/roast/Weeks";

function BatchPage() {
  const router = useRouter();
  const date = router.query.date as string | undefined;

  return (
    <RoastShell base={W4Base} active={null}>
      <Head>
        <title>Batch | Daily Roast</title>
      </Head>
      <BatchView date={date}/>
    </RoastShell>
  );
}

export default BatchPage;
