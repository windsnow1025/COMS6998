import React from "react";
import Head from "next/head";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import SignInView from "@/components/roast/SignInView";
import {W5Base} from "@/lib/roast/Weeks";

function SignInPage() {
  return (
    <RoastShell base={W5Base} brandMark={FlameMark} active={null}>
      <Head>
        <title>Sign in | Daily Roast</title>
      </Head>
      <SignInView brandMark={FlameMark}/>
    </RoastShell>
  );
}

export default SignInPage;
