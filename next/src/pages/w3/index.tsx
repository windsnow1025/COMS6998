import React from "react";
import {Container, Typography} from "@mui/material";
import Head from "next/head";
import AccountBar from "@/components/user/AccountBar";
import CaptionList from "@/components/caption/CaptionList";

function W3() {
  return (
    <div className="local-scroll-container">
      <Head>
        <title>The Humor Project</title>
        <meta name="description" content="AI-generated captions for images."/>
      </Head>
      <div className="local-scroll-scrollable p-4">
        <Container maxWidth="lg">
          <AccountBar/>
          <Typography variant="h4" gutterBottom>
            Captions
          </Typography>
          <CaptionList/>
        </Container>
      </div>
    </div>
  );
}

export default W3;
