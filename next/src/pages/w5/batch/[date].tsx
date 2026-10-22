import React from "react";
import Head from "next/head";
import {useRouter} from "next/router";
import AccountMenu from "@/components/roast/AccountMenu";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import BatchView from "@/components/roast/BatchView";
import {W5Base} from "@/lib/roast/Weeks";

function BatchPage() {
  const router = useRouter();
  const date = router.query.date as string | undefined;

  return (
    <RoastShell base={W5Base} brandMark={FlameMark} account={<AccountMenu/>} active={null}>
      <Head>
        <title>Batch | Daily Roast</title>
      </Head>
      <BatchView date={date}/>
    </RoastShell>
  );
}

export default BatchPage;
