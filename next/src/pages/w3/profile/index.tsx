import React from "react";
import Head from "next/head";
import Profile from "@/components/user/Profile";

function ProfilePage() {
  return (
    <div className="local-scroll-container">
      <Head>
        <title>Profile</title>
      </Head>
      <div className="local-scroll-scrollable">
        <Profile/>
      </div>
    </div>
  );
}

export default ProfilePage;
