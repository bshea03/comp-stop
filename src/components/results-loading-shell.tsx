"use client";

import { ComparisonBarSkeleton } from "@/components/comparison-bar";
import { MarketplaceCardSkeleton } from "@/components/marketplace-card";
import { useSearchState } from "@/components/search-state";
import type { MarketplaceId } from "@/lib/marketplaces/types";

type MarketplacePanel = { id: MarketplaceId; label: string };

export function ResultsLoadingShell({
  showResults,
  marketplaces,
  recap,
  children,
}: {
  showResults: boolean;
  marketplaces: readonly MarketplacePanel[];
  recap: React.ReactNode;
  children: React.ReactNode;
}) {
  const { isPendingNavigation } = useSearchState();

  if (!showResults) return null;

  if (isPendingNavigation) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        {recap}
        <ComparisonBarSkeleton loading />
        <div className="grid gap-5 md:grid-cols-2">
          {marketplaces.map(({ id, label }) => (
            <MarketplaceCardSkeleton
              key={id}
              marketplace={id}
              label={label}
              loading
            />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
