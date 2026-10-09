import React from "react";
import Head from "next/head";
import RoastShell from "@/components/roast/RoastShell";
import TopView from "@/components/roast/TopView";
import {W5Base} from "@/lib/roast/Weeks";

function TopPage() {
  return (
    <RoastShell base={W5Base} active="top" wide>
      <Head>
        <title>Top roasts | Daily Roast</title>
        <meta name="description" content="The captions the crowd picked, from every batch that has closed."/>
      </Head>
      <TopView/>
    </RoastShell>
  );
}

export default TopPage;
