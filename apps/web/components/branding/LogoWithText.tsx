'use client';

import Image from 'next/image';
import React from 'react';

export interface LogoWithTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { width: 160, height: 40 },
  md: { width: 200, height: 50 },
  lg: { width: 280, height: 70 },
  xl: { width: 360, height: 90 },
};

export function LogoWithText({ size = 'md', className }: LogoWithTextProps) {
  const dimensions = sizeMap[size];

  return (
<Image
  src='/true-name-path-banner.png'
  alt='TrueNamePath'
  width={dimensions.width}
  height={dimensions.height}
  className={className}
  priority
  style={{ objectFit: 'contain' }}
/>
  );
}
