import React from "react";
import Head from "next/head";
import AccountMenu from "@/components/roast/AccountMenu";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import RoastView from "@/components/roast/RoastView";
import {W5Base} from "@/lib/roast/Weeks";

function RoastPage() {
  return (
    <RoastShell base={W5Base} brandMark={FlameMark} account={<AccountMenu/>} active="roast">
      <Head>
        <title>Roast my photo | Daily Roast</title>
      </Head>
      <RoastView/>
    </RoastShell>
  );
}

export default RoastPage;
