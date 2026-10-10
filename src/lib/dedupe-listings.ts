import type { SoldListing } from "@/lib/marketplaces/types";

/** Adapters (e.g. eBay SoldComps pagination) can return the same item id twice. */
export function dedupeListingsById(listings: SoldListing[]): SoldListing[] {
  const seen = new Set<string>();
  return listings.filter((listing) => {
    if (seen.has(listing.id)) return false;
    seen.add(listing.id);
    return true;
  });
}
