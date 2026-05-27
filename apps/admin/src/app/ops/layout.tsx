import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageLayout } from '@admin-platform/ui';
import { OpsSidebar } from '@/components/ops/OpsSidebar';
import { OpsHeader }  from '@/components/ops/OpsHeader';

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <PageLayout sidebar={<OpsSidebar />} header={<OpsHeader />}>
      {children}
    </PageLayout>
  );
}
