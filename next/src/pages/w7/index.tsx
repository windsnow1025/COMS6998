import React from "react";
import Head from "next/head";
import AccountMenu from "@/components/roast/AccountMenu";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import TodayView from "@/components/roast/TodayView";
import {W7Base} from "@/lib/roast/Weeks";

function W7() {
  return (
    <RoastShell base={W7Base} brandMark={FlameMark} account={<AccountMenu/>} active="today">
      <Head>
        <title>Daily Roast</title>
        <meta name="description" content="A daily caption game for Columbia students. AI writes 3 captions for each photo in different comedic voices. You pick the funniest."/>
      </Head>
      <TodayView/>
    </RoastShell>
  );
}

export default W7;
