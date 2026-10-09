import React from "react";
import Head from "next/head";
import {CafeMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import RoastView from "@/components/roast/RoastView";
import {W4Base} from "@/lib/roast/Weeks";

function RoastPage() {
  return (
    <RoastShell base={W4Base} brandMark={CafeMark} active="roast">
      <Head>
        <title>Roast my photo | Daily Roast</title>
      </Head>
      <RoastView/>
    </RoastShell>
  );
}

export default RoastPage;
