/**
 * Shared Page Layout Wrapper - Eliminates Code Duplication
 * Academic constraint: Keep under 30 lines
 */

import React from 'react';
import { Box, Container, useMantineTheme, rem } from '@mantine/core';

interface PageLayoutProps {
  children: React.ReactNode;
  size?: 'sm' | 'md';
  centered?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  size = 'sm',
  centered = true,
}) => {
  const theme = useMantineTheme();

  return (
<Box
  style={{
minHeight: '100vh',
backgroundColor: theme.colors.gray[0],
display: centered ? 'flex' : 'block',
alignItems: centered ? 'center' : 'initial',
justifyContent: centered ? 'center' : 'initial',
  }}
  p={centered ? rem(16) : { base: rem(16), sm: theme.spacing.lg }}
>
  <Container size={size}>{children}</Container>
</Box>
  );
};
