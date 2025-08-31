'use client';

import Image from 'next/image';
import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export function Logo({ size = 'md', className }: LogoProps) {
  const dimensions = sizeMap[size];

  return (
<Image
  src='/true-name-path-logo.png'
  alt='TrueNamePath Logo'
  width={dimensions}
  height={dimensions}
  className={className}
  priority
  style={{ objectFit: 'contain' }}
/>
  );
}
