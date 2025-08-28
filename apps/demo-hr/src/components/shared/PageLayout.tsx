/**
 * Shared Page Layout Wrapper - Eliminates Code Duplication
 * Academic constraint: Keep under 30 lines
 */

import React from 'react';
import { Box, Container, useMantineTheme, rem, Image } from '@mantine/core';

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
  const theme = useMantineTheme();

  return (
<Box style={{ minHeight: '100vh', backgroundColor: theme.colors.gray[0] }}>
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
style={{
  minHeight: showLogo ? 'calc(100vh - 140px)' : '100vh',
  display: centered ? 'flex' : 'block',
  alignItems: centered ? 'center' : 'initial',
  justifyContent: centered ? 'center' : 'initial',
}}
p={centered ? rem(16) : { base: rem(16), sm: theme.spacing.lg }}
  >
<Container size={size}>{children}</Container>
  </Box>
</Box>
  );
};
