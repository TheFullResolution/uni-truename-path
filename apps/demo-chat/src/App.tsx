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
 */
const App: React.FC = () => {
  return (
<MantineProvider theme={chatTheme}>
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
<Route path='/callback' element={<CallbackPage />} />
<Route path='/chat' element={<ChatPage />} />
  </Routes>
</BrowserRouter>
  </SWRConfig>
</MantineProvider>
  );
};

export default App;
