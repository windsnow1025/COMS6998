import React from "react";
import Head from "next/head";
import AccountMenu from "@/components/roast/w5/AccountMenu";
import {FlameMark} from "@/components/roast/BrandMarks";
import RoastShell from "@/components/roast/w5/RoastShell";
import SignInView from "@/components/roast/w5/SignInView";
import {W5Base} from "@/lib/roast/Weeks";

function SignInPage() {
  return (
    <RoastShell base={W5Base} brandMark={FlameMark} account={<AccountMenu/>} active={null}>
      <Head>
        <title>Sign in | Daily Roast</title>
      </Head>
      <SignInView brandMark={FlameMark}/>
    </RoastShell>
  );
}

export default SignInPage;
