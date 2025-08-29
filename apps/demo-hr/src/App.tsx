import React from 'react';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { hrTheme } from './theme';
import { LandingPage } from './components/LandingPage';
import { Callback } from './components/Callback';
import { Dashboard } from './components/Dashboard';
import { createOAuthCacheProvider } from '@uni-final/truename-oauth';

/**
 * Demo HR Application Root Component
 *
 * Configures SWR with persistent cache provider for OAuth token management.
 * Combines request deduplication (React StrictMode fix) with localStorage
 * persistence for academic demonstration of proper cache management.
 */
const App: React.FC = () => {
  return (
<MantineProvider theme={hrTheme}>
  <SWRConfig
value={{
  // Custom cache provider: Syncs with localStorage for persistence
  provider: createOAuthCacheProvider,

  // React StrictMode Prevention: 2-second deduplication window
  dedupingInterval: 2000,

  // OAuth Token Configuration: Enable focus-based revalidation
  revalidateOnFocus: true,
  revalidateOnReconnect: false,

  // Academic Simplicity: No automatic retries for OAuth failures
  shouldRetryOnError: false,
  errorRetryCount: 0,
}}
  >
<BrowserRouter>
  <Routes>
<Route path='/' element={<LandingPage />} />
<Route path='/callback' element={<Callback />} />
<Route path='/dashboard' element={<Dashboard />} />
  </Routes>
</BrowserRouter>
  </SWRConfig>
</MantineProvider>
  );
};

export default App;
