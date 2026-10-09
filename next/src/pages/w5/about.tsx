import React from "react";
import Head from "next/head";
import AboutView from "@/components/roast/AboutView";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import {W5Base} from "@/lib/roast/Weeks";

function AboutPage() {
  return (
    <RoastShell base={W5Base} brandMark={FlameMark} active={null}>
      <Head>
        <title>How it works | Daily Roast</title>
        <meta name="description" content="A daily caption game for Columbia students. AI writes 3 captions for each photo in different comedic voices. You pick the funniest."/>
      </Head>
      <AboutView/>
    </RoastShell>
  );
}

export default AboutPage;
