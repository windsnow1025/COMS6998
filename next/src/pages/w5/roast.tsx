import React from "react";
import Head from "next/head";
import AccountMenu from "@/components/roast/w5/AccountMenu";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/w5/RoastShell";
import RoastView from "@/components/roast/w5/RoastView";
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
