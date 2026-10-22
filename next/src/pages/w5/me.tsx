import React from "react";
import Head from "next/head";
import AccountMenu from "@/components/roast/AccountMenu";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import MeView from "@/components/roast/MeView";
import MyBatches from "@/components/roast/MyBatches";
import {W5Base} from "@/lib/roast/Weeks";

function MePage() {
  return (
    <RoastShell base={W5Base} brandMark={FlameMark} account={<AccountMenu/>} active="me">
      <Head>
        <title>Me | Daily Roast</title>
      </Head>
      <MeView batchesSection={<MyBatches/>}/>
    </RoastShell>
  );
}

export default MePage;
