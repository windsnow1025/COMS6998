import React from "react";
import Head from "next/head";
import AccountLink from "@/components/roast/w4/AccountLink";
import {CafeMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/w4/RoastShell";
import SignInView from "@/components/roast/w4/SignInView";
import {W4Base} from "@/lib/roast/Weeks";

function SignInPage() {
  return (
    <RoastShell base={W4Base} brandMark={CafeMark} account={<AccountLink/>} active={null}>
      <Head>
        <title>Sign in | Daily Roast</title>
      </Head>
      <SignInView brandMark={CafeMark}/>
    </RoastShell>
  );
}

export default SignInPage;
