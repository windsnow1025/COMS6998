import React from "react";
import Head from "next/head";
import RoastShell from "@/components/roast/RoastShell";
import TodayView from "@/components/roast/TodayView";
import {W5Base} from "@/lib/roast/Weeks";

function W5() {
  return (
    <RoastShell base={W5Base} active="today">
      <Head>
        <title>Daily Roast</title>
        <meta name="description" content="A daily caption game for Columbia students. AI writes 3 captions for each photo in different comedic voices. You pick the funniest."/>
      </Head>
      <TodayView/>
    </RoastShell>
  );
}

export default W5;
