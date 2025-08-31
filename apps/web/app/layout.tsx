import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';
import React from 'react';
import {
  MantineProvider,
  ColorSchemeScript,
  mantineHtmlProps,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { theme } from '../utils/theme';
import { AuthProvider } from '../utils/context';
import { SharedFooter } from '@/components/layout/SharedFooter';

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
<title>{metadata.title}</title>
<meta name='description' content={metadata.description} />
<ColorSchemeScript />
<link rel='shortcut icon' href='/favicon.ico' />
<link
  rel='icon'
  type='image/png'
  sizes='32x32'
  href='/favicon-32x32.png'
/>
<link
  rel='icon'
  type='image/png'
  sizes='16x16'
  href='/favicon-16x16.png'
/>
<link
  rel='apple-touch-icon'
  sizes='180x180'
  href='/apple-touch-icon.png'
/>
<link rel='manifest' href='/site.webmanifest' />
<meta
  name='viewport'
  content='minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no'
/>
  </head>
  <body
style={{
  margin: 0,
  padding: 0,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
}}
  >
<MantineProvider theme={theme}>
  <ModalsProvider>
<Notifications />
<AuthProvider>
  <main
style={{
  flex: 1,
  backgroundColor: 'var(--mantine-color-gray-0)',
}}
  >
{children}
  </main>
  <SharedFooter />
</AuthProvider>
  </ModalsProvider>
</MantineProvider>
  </body>
</html>
  );
}
