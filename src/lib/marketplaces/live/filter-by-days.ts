import type { SoldListing } from "@/lib/marketplaces/types";

/** Keeps listings whose `soldAt` falls within the last `daysBack` calendar days. */
export function filterListingsByDaysBack(
  listings: SoldListing[],
  daysBack: number,
): SoldListing[] {
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  return listings.filter((listing) => Date.parse(listing.soldAt) >= cutoff);
}
