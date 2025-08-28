import React from 'react';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { chatTheme } from './theme';
import { LandingPage } from './pages/LandingPage';
import { CallbackPage } from './pages/CallbackPage';
import { ChatPage } from './pages/ChatPage';
import { createOAuthCacheProvider } from '@uni-final/truename-oauth';

/**
 * Demo Chat Application Root Component
 *
 * Configures SWR with persistent cache provider for OAuth token management.
 * Focuses on casual context-aware identity display for chat communication.
 */
const App: React.FC = () => {
  return (
<MantineProvider theme={chatTheme}>
  <SWRConfig
value={{
  // Custom cache provider: Syncs with localStorage for persistence
  provider: createOAuthCacheProvider,

  // React StrictMode Prevention: 2-second deduplication window
  dedupingInterval: 2000,

  // OAuth Token Configuration: Prevent automatic revalidation
  revalidateOnFocus: false,
  revalidateOnReconnect: false,

  // Academic Simplicity: No automatic retries for OAuth failures
  shouldRetryOnError: false,
  errorRetryCount: 0,
}}
  >
<BrowserRouter>
  <Routes>
<Route path='/' element={<LandingPage />} />
<Route path='/callback' element={<CallbackPage />} />
<Route path='/chat' element={<ChatPage />} />
  </Routes>
</BrowserRouter>
  </SWRConfig>
</MantineProvider>
  );
};

export default App;
