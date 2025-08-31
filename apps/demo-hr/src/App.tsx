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
 */
const App: React.FC = () => {
  return (
<MantineProvider theme={hrTheme}>
  <SWRConfig
value={{
  provider: createOAuthCacheProvider,
  dedupingInterval: 2000,
  revalidateOnFocus: true,
  revalidateOnReconnect: false,
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
