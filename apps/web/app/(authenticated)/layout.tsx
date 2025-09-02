import { AuthProvider } from '@/utils/context';
import { SharedFooter } from '@/components/layout/SharedFooter';
import type { ReactNode } from 'react';

// Force dynamic rendering for all authenticated routes
export const dynamic = 'force-dynamic';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

/**
 * Authenticated route group layout
 */
export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return (
<AuthProvider>
  <main
style={{
  flex: 1,
  backgroundColor: 'var(--mantine-color-gray-0)',
}}
  >
{children}
  </main>
  <SharedFooter />
</AuthProvider>
  );
}
