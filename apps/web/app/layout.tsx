import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import React from 'react';
import {
  MantineProvider,
  ColorSchemeScript,
  mantineHtmlProps,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '../lib/theme';
import { AuthProvider } from '../lib/context/AuthProvider';
import { AuthErrorBoundary } from '../components/AuthErrorBoundary';

export const metadata = {
  title: 'TrueNamePath - Context-Aware Identity Management',
  description:
'API that delivers the "right name" to the "right audience" at the "right time"',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<html lang='en' {...mantineHtmlProps}>
  <head>
<ColorSchemeScript />
<link rel='shortcut icon' href='/favicon.svg' />
<meta
  name='viewport'
  content='minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no'
/>
  </head>
  <body>
<MantineProvider theme={theme}>
  <Notifications />
  <AuthErrorBoundary>
<AuthProvider>{children}</AuthProvider>
  </AuthErrorBoundary>
</MantineProvider>
  </body>
</html>
  );
}
