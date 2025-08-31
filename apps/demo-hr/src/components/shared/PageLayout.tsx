/**
 * Shared Page Layout Wrapper
 */

import React from 'react';
import { Box, Container, Image } from '@mantine/core';

interface PageLayoutProps {
  children: React.ReactNode;
  size?: 'sm' | 'md';
  centered?: boolean;
  showLogo?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  size = 'sm',
  centered = true,
  showLogo = true,
}) => {
  return (
<Box bg='gray.0' mih='100vh'>
  {showLogo && (
<Box ta='center' pt='xl' pb='md'>
  <Image
src='/logo-demo-hr.png'
alt='Enterprise HR Portal'
h={{ base: 80, sm: 100 }}
w='auto'
mx='auto'
  />
</Box>
  )}
  <Box
display={centered ? 'flex' : 'block'}
mih={showLogo ? 'calc(100vh - 140px)' : '100vh'}
style={
  centered
? {
alignItems: 'center',
justifyContent: 'center',
  }
: undefined
}
p={centered ? 'md' : { base: 'md', sm: 'lg' }}
  >
<Container size={size}>{children}</Container>
  </Box>
</Box>
  );
};
