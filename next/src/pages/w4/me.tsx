import React from "react";
import Head from "next/head";
import {CafeMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import MeView from "@/components/roast/MeView";
import {W4Base} from "@/lib/roast/Weeks";

function MePage() {
  return (
    <RoastShell base={W4Base} brandMark={CafeMark} active="me">
      <Head>
        <title>Me | Daily Roast</title>
      </Head>
      <MeView/>
    </RoastShell>
  );
}

export default MePage;
