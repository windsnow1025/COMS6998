import React from "react";
import Head from "next/head";
import AccountMenu from "@/components/roast/AccountMenu";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/RoastShell";
import SignInView from "@/components/roast/SignInView";
import {W7Base} from "@/lib/roast/Weeks";

function SignInPage() {
  return (
    <RoastShell base={W7Base} brandMark={FlameMark} account={<AccountMenu/>} active={null}>
      <Head>
        <title>Sign in | Daily Roast</title>
      </Head>
      <SignInView brandMark={FlameMark}/>
    </RoastShell>
  );
}

export default SignInPage;
