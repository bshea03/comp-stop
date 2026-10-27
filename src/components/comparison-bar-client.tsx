"use client";

import { ComparisonBarForKind } from "@/components/comparison-bar";
import { useMarketplaceVisibility } from "@/components/marketplace-visibility";
import type {
  ListingKind,
  MarketplaceResult,
} from "@/lib/marketplaces/types";

export function ComparisonBarForKindFiltered({
  results,
  listingKind,
}: {
  results: readonly MarketplaceResult[];
  listingKind: ListingKind;
}) {
  const { hydrated, isEnabled } = useMarketplaceVisibility();

  const filtered = hydrated
    ? results.filter((result) => isEnabled(result.marketplace))
    : results;

  return <ComparisonBarForKind results={filtered} listingKind={listingKind} />;
}
