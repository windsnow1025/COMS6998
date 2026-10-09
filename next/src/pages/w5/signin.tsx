import React from "react";
import Head from "next/head";
import RoastShell from "@/components/roast/RoastShell";
import SignInView from "@/components/roast/SignInView";
import {W5Base} from "@/lib/roast/Weeks";

function SignInPage() {
  return (
    <RoastShell base={W5Base} active={null}>
      <Head>
        <title>Sign in | Daily Roast</title>
      </Head>
      <SignInView/>
    </RoastShell>
  );
}

export default SignInPage;
