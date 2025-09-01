import type { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * Public route group layout
 * Simple layout for public pages like documentation that don't require authentication
 * Does not include AuthProvider to enable static generation
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
<main
  style={{
flex: 1,
backgroundColor: 'var(--mantine-color-gray-0)',
  }}
>
  {children}
</main>
  );
}
