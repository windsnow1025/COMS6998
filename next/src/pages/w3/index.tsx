import React from "react";
import {Alert, Avatar, Button, Container, Stack, Typography} from "@mui/material";
import Head from "next/head";
import {useAuthentication, useSession} from "@/session/SessionContext";

function W3() {
  const session = useSession();
  const authentication = useAuthentication();

  return (
    <div className="local-scroll-container">
      <Head>
        <title>The Humor Project</title>
        <meta name="description" content="Your profile on The Humor Project."/>
      </Head>
      <div className="local-scroll-scrollable p-4">
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom>
            Profile
          </Typography>
          {session?.user ? (
            <Stack spacing={2} sx={{alignItems: "flex-start"}}>
              <Avatar src={session.user.image ?? undefined} alt={session.user.name ?? undefined}/>
              <Typography variant="body1">
                {session.user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {session.user.email}
              </Typography>
              <Button variant="outlined" onClick={() => authentication?.signOut()}>
                Sign out
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{alignItems: "flex-start"}}>
              <Alert severity="info">Sign in to see your profile.</Alert>
              <Button variant="contained" onClick={() => authentication?.signIn()}>
                Sign in
              </Button>
            </Stack>
          )}
        </Container>
      </div>
    </div>
  );
}

export default W3;
