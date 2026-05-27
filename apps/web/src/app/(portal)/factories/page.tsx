import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi } from '@/lib/api';
import { Card } from '@admin-platform/ui';
import { FactoryCard } from '@/components/factories/FactoryCard';
import type { FactoryResponse, ApiPaginatedResponse } from '@admin-platform/types';
import { FactoryStatus } from '@admin-platform/types';

export const metadata: Metadata = { title: 'Browse Factories' };

export default async function FactoriesPage({
  searchParams,
}: {
  searchParams: { country?: string; page?: string };
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  const params: Record<string, string> = {
    status: FactoryStatus.VERIFIED,
    limit:  '24',
    page:   searchParams.page ?? '1',
  };

  if (searchParams.country) params.country = searchParams.country;

  let factories: FactoryResponse[] = [];
  let totalPages = 1;

  try {
    // The API returns paginated data — we unwrap the array from the envelope
    const res = await api.get<ApiPaginatedResponse<FactoryResponse>>(
      '/factories',
      params,
    ) as unknown as ApiPaginatedResponse<FactoryResponse>;

    // Handle both envelope shapes: sometimes data is raw array, sometimes wrapped
    if (Array.isArray(res)) {
      factories = res as FactoryResponse[];
    } else {
      factories = [...(res as unknown as { data: FactoryResponse[] }).data ?? []];
      totalPages = (res as unknown as { meta: { totalPages: number } }).meta?.totalPages ?? 1;
    }
  } catch {
    // Show empty state on error
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl text-foreground mb-1">
            BROWSE FACTORIES
          </h1>
          <p className="font-body text-sm text-foreground-muted">
            Verified African manufacturers ready to produce your order.
          </p>
        </div>
      </div>

      {/* Results */}
      {factories.length === 0 ? (
        <Card variant="elevated" padding="lg">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏭</div>
            <h3 className="font-display text-xl text-foreground mb-2">
              NO FACTORIES FOUND
            </h3>
            <p className="font-body text-sm text-foreground-muted">
              Try adjusting your filters or check back later as more factories
              are verified.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <p className="font-body text-sm text-foreground-muted">
            {factories.length} verified{' '}
            {factories.length === 1 ? 'factory' : 'factories'} found
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {factories.map((factory) => (
              <FactoryCard key={factory.id} factory={factory} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
