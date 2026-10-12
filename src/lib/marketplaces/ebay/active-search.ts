import { searchEbayBrowseActive } from "@/lib/marketplaces/ebay/browse-api";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

/** Active eBay listings via the official Buy Browse API. */
export async function searchEbayActive(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  return searchEbayBrowseActive(query, signal);
}
