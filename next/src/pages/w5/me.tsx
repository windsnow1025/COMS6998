import React from "react";
import Head from "next/head";
import AccountLink from "@/components/roast/AccountLink";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import MeView from "@/components/roast/w4/MeView";
import MyBatches from "@/components/roast/MyBatches";
import {W5Base} from "@/lib/roast/Weeks";

function MePage() {
  return (
    <RoastShell base={W5Base} brandMark={FlameMark} account={<AccountLink/>} active="me">
      <Head>
        <title>Me | Daily Roast</title>
      </Head>
      <MeView batchesSection={<MyBatches/>}/>
    </RoastShell>
  );
}

export default MePage;
