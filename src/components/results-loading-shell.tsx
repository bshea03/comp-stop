"use client";

import { MarketplaceResultsSectionSkeleton } from "@/components/marketplace-results-section-skeleton";
import { ResultsViewTabs } from "@/components/results-view-tabs";
import { useSearchState } from "@/components/search-state";

export function ResultsLoadingShell({
  showResults,
  recap,
  children,
}: {
  showResults: boolean;
  recap: React.ReactNode;
  children: React.ReactNode;
}) {
  const { isPendingNavigation } = useSearchState();

  if (!showResults) return null;

  if (isPendingNavigation) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        {recap}
        <ResultsViewTabs
          sold={
            <MarketplaceResultsSectionSkeleton listingKind="sold" loading />
          }
          active={
            <MarketplaceResultsSectionSkeleton listingKind="active" loading />
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recap}
      {children}
    </div>
  );
}
