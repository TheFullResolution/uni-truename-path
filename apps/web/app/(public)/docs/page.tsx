import { redirect } from 'next/navigation';
import type { Route } from 'next';

export default function DocsPage() {
  // Redirect to the overview page as the default documentation page
  redirect('/docs/overview' as Route);
}
