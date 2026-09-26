import React from "react";
import {Container, Typography} from "@mui/material";
import Head from "next/head";

function W1() {
  return (
    <div className="local-scroll-container">
      <Head>
        <title>Hello World</title>
      </Head>
      <div className="local-scroll-scrollable p-4">
        <Container maxWidth="lg">
          <Typography variant="h4">
            Hello World
          </Typography>
        </Container>
      </div>
    </div>
  );
}

export default W1;
