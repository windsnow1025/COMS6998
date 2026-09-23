import '../global.css';

import * as React from 'react';
import Head from 'next/head';
import CssBaseline from '@mui/material/CssBaseline';

import AppTheme from "@/components/common/shared-theme/AppTheme";

export default function App({Component}: { Component: React.ElementType }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width"/>
      </Head>
      <AppTheme>
        <CssBaseline enableColorScheme/>
        <div className="local-scroll-root">
          <Component/>
        </div>
      </AppTheme>
    </>
  );
}
