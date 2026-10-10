import { buildEbaySoldSearchUrl } from "@/lib/marketplaces/ebay/build-search-url";
import { searchEbaySoldComps } from "@/lib/marketplaces/ebay/sold-comps-search";
import { resolveAdapter } from "@/lib/marketplaces/live/resolve-adapter";
import { ebayMockAdapter } from "@/lib/marketplaces/ebay/mock-adapter";
import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

/**
 * Live eBay sold comps use SoldComps (https://sold-comps.com). eBay's own APIs
 * do not expose sold search for standard developer keys.
 */
const ebayLiveAdapter: MarketplaceAdapter = {
  id: "ebay",
  label: "eBay",
  dataSource: "live",
  listingKind: "sold",
  buildSearchUrl: buildEbaySoldSearchUrl,
  search: searchEbaySoldComps,
};

export const ebayAdapter = resolveAdapter(ebayLiveAdapter, ebayMockAdapter);
