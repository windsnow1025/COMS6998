import React from "react";
import Head from "next/head";
import RoastShell from "@/components/roast/RoastShell";
import TodayView from "@/components/roast/TodayView";
import {W4Base} from "@/lib/roast/Weeks";

function W4() {
  return (
    <RoastShell base={W4Base} active="today">
      <Head>
        <title>Daily Roast</title>
        <meta name="description" content="A fresh batch of photos every day. AI writes the roasts. You pick the winner."/>
      </Head>
      <TodayView/>
    </RoastShell>
  );
}

export default W4;
