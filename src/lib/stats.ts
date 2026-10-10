import type { PriceStats, SoldListing } from "@/lib/marketplaces/types";

/** Fraction dropped from each end before taking the headline average. */
const TRIM_FRACTION = 0.1;

function mean(values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function median(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * Resale comps are outlier-prone: a mislabelled listing or a bundle sale can
 * drag a plain average well off what the garment actually sells for. Dropping
 * the top and bottom 10% gives a figure that is safer to price against.
 */
function trimmedMean(sorted: readonly number[]): number {
  const dropPerSide = Math.floor(sorted.length * TRIM_FRACTION);
  const kept = sorted.slice(dropPerSide, sorted.length - dropPerSide);
  return mean(kept.length > 0 ? kept : sorted);
}

export function computePriceStats(
  listings: readonly SoldListing[],
): PriceStats | null {
  if (listings.length === 0) return null;

  const prices = listings.map((listing) => listing.priceCents);
  const sorted = [...prices].sort((a, b) => a - b);
  const soldDates = listings.map((listing) => listing.soldAt).sort();

  return {
    count: listings.length,
    currency: listings[0].currency,
    meanCents: mean(prices),
    trimmedMeanCents: trimmedMean(sorted),
    medianCents: median(sorted),
    minCents: sorted[0],
    maxCents: sorted[sorted.length - 1],
    oldestSoldAt: soldDates[0],
    newestSoldAt: soldDates[soldDates.length - 1],
  };
}

export type BlendedStats = {
  stats: PriceStats;
  /** Marketplaces that contributed comps. */
  marketplaceCount: number;
};

/**
 * Combines comps across marketplaces into one figure. Returns `null` when the
 * contributing sites report different currencies, since averaging across them
 * would be meaningless.
 */
export function computeBlendedStats(
  listingsByMarketplace: readonly (readonly SoldListing[])[],
): BlendedStats | null {
  const contributing = listingsByMarketplace.filter(
    (listings) => listings.length > 0,
  );
  if (contributing.length === 0) return null;

  const all = contributing.flat();
  const currencies = new Set(all.map((listing) => listing.currency));
  if (currencies.size > 1) return null;

  const stats = computePriceStats(all);
  return stats ? { stats, marketplaceCount: contributing.length } : null;
}
