import React from "react";
import Head from "next/head";
import AccountLink from "@/components/roast/AccountLink";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import RoastView from "@/components/roast/w4/RoastView";
import {W5Base} from "@/lib/roast/Weeks";

function RoastPage() {
  return (
    <RoastShell base={W5Base} brandMark={FlameMark} account={<AccountLink/>} active="roast">
      <Head>
        <title>Roast my photo | Daily Roast</title>
      </Head>
      <RoastView/>
    </RoastShell>
  );
}

export default RoastPage;
