import React from "react";
import Head from "next/head";
import AccountLink from "@/components/roast/AccountLink";
import {CafeMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import SignInView from "@/components/roast/SignInView";
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
