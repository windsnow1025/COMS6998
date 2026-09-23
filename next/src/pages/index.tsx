import React from "react";
import {Container, Typography} from "@mui/material";
import Head from "next/head";
import CaptionList from "@/components/caption/CaptionList";

function Index() {
  return (
    <div className="local-scroll-container">
      <Head>
        <title>The Humor Project</title>
        <meta name="description" content="AI-generated captions for images."/>
      </Head>
      <div className="local-scroll-scrollable p-4">
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom>
            Captions
          </Typography>
          <CaptionList/>
        </Container>
      </div>
    </div>
  );
}

export default Index;
