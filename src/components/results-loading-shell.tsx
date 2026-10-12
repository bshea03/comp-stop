"use client";

import { MarketplaceResultsSectionSkeleton } from "@/components/marketplace-results-section";
import { useSearchState } from "@/components/search-state";
import type { ListingKind, MarketplaceId } from "@/lib/marketplaces/types";

type MarketplacePanel = {
  id: MarketplaceId;
  label: string;
  listingKind: ListingKind;
};

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
    const hasSold = marketplaces.some((panel) => panel.listingKind === "sold");
    const hasActive = marketplaces.some(
      (panel) => panel.listingKind === "active",
    );

    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        {recap}
        {hasSold ? (
          <MarketplaceResultsSectionSkeleton listingKind="sold" loading />
        ) : null}
        {hasActive ? (
          <MarketplaceResultsSectionSkeleton
            listingKind="active"
            loading
            className="space-y-6"
          />
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
