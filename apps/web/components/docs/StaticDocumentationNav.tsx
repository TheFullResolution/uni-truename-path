'use client';

import { Group, Anchor, Text } from '@mantine/core';
import { IconBook, IconRocket, IconCode } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';

/**
 * Static documentation navigation with active page highlighting
 * Uses anchor links with pathname-based active state detection
 */
export function StaticDocumentationNav() {
  const pathname = usePathname();

  const navItems = [
{
  href: '/docs/overview',
  icon: IconBook,
  label: 'Overview',
},
{
  href: '/docs/quick-start',
  icon: IconRocket,
  label: 'Quick Start',
},
{
  href: '/docs/technical',
  icon: IconCode,
  label: 'Technical Details',
},
  ];

  const isActive = (href: string): boolean => {
return pathname === href;
  };

  return (
<Group gap='md' justify='center'>
  {navItems.map((item) => {
const IconComponent = item.icon;
const active = isActive(item.href);

return (
  <Anchor
key={item.href}
component={Link}
href={item.href as Route}
size='sm'
fw={500}
c={active ? 'brand.7' : 'brand.6'}
style={{
  textDecoration: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 150ms ease',
  backgroundColor: active
? 'var(--mantine-color-brand-1)'
: 'transparent',
}}
styles={{
  root: {
'&:hover': {
  backgroundColor: active
? 'var(--mantine-color-brand-2)'
: 'var(--mantine-color-brand-0)',
  color: 'var(--mantine-color-brand-7)',
},
  },
}}
  >
<IconComponent size={16} />
<Text component='span' size='sm'>
  {item.label}
</Text>
  </Anchor>
);
  })}
</Group>
  );
}
