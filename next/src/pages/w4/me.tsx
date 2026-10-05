import React from "react";
import Head from "next/head";
import RoastShell from "@/components/roast/RoastShell";
import MeView from "@/components/roast/MeView";
import {W4Base} from "@/lib/roast/Weeks";

function MePage() {
  return (
    <RoastShell base={W4Base} active="me">
      <Head>
        <title>Me | Daily Roast</title>
      </Head>
      <MeView/>
    </RoastShell>
  );
}

export default MePage;
