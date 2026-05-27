import Link from 'next/link';
import { Card, Badge } from '@admin-platform/ui';
import { formatZar, formatTrustScore, trustScoreColorClass } from '@/lib/format';
import type { FactoryResponse } from '@admin-platform/types';

interface FactoryCardProps {
  factory: FactoryResponse;
}

export function FactoryCard({ factory }: FactoryCardProps) {
  return (
    <Link href={`/factories/${factory.id}`} className="block group">
      <Card
        variant="elevated"
        padding="md"
        hoverable
        className="h-full transition-all duration-150 group-hover:shadow-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-body font-semibold text-foreground text-base leading-tight truncate group-hover:text-brand transition-colors">
              {factory.name}
            </h3>
            <p className="font-body text-xs text-foreground-muted mt-0.5">
              {factory.region}, {factory.country}
            </p>
          </div>

          {/* Trust score */}
          <div className="shrink-0 ml-3 text-right">
            <div
              className={`font-mono text-lg font-bold ${trustScoreColorClass(factory.trustScore)}`}
            >
              {formatTrustScore(factory.trustScore)}
            </div>
            <p className="font-body text-2xs text-foreground-subtle">
              Trust Score
            </p>
          </div>
        </div>

        {/* Description */}
        {factory.description !== null && factory.description.length > 0 && (
          <p className="font-body text-xs text-foreground-muted mb-4 line-clamp-2">
            {factory.description}
          </p>
        )}

        {/* Capabilities */}
        {factory.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {factory.capabilities.slice(0, 3).map((cap) => (
              <Badge key={cap} variant="default" size="sm">
                {cap}
              </Badge>
            ))}
            {factory.capabilities.length > 3 && (
              <Badge variant="default" size="sm">
                +{factory.capabilities.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <p className="font-body text-2xs text-foreground-subtle uppercase tracking-wide">
              Min Order
            </p>
            <p className="font-mono text-sm text-foreground">
              {formatZar(factory.minimumOrderValue)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-body text-2xs text-foreground-subtle uppercase tracking-wide">
              Capacity / mo
            </p>
            <p className="font-mono text-sm text-foreground">
              {factory.capacityUnitsPerMonth.toLocaleString()} units
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
