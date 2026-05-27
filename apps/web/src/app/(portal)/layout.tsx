import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageLayout } from '@admin-platform/ui';
import { PortalSidebar } from '@/components/portal/PortalSidebar';
import { PortalHeader }  from '@/components/portal/PortalHeader';

/**
 * Authenticated portal layout — wraps all /dashboard, /factories,
 * /orders, and /profile routes.
 *
 * Server Component: verifies session server-side before rendering.
 * If no session exists the middleware will redirect first, but this
 * is a defensive double-check.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <PageLayout
      sidebar={<PortalSidebar />}
      header={<PortalHeader />}
    >
      {children}
    </PageLayout>
  );
}
