/**
 * Shared Page Layout Wrapper - Eliminates Code Duplication
 * Academic constraint: Keep under 30 lines
 */

import React from 'react';
import { Box, Container, rem, Image } from '@mantine/core';

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
<Box bg='gray.0' style={{ minHeight: '100vh' }}>
  {showLogo && (
<Box ta='center' pt={rem(24)} pb={rem(16)}>
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
style={{
  minHeight: showLogo ? 'calc(100vh - 140px)' : '100vh',
  alignItems: centered ? 'center' : 'initial',
  justifyContent: centered ? 'center' : 'initial',
}}
p={centered ? rem(16) : { base: rem(16), sm: 'lg' }}
  >
<Container size={size}>{children}</Container>
  </Box>
</Box>
  );
};
