import { buildEbayActiveSearchUrl } from "@/lib/marketplaces/ebay/build-search-url";
import { searchEbayActive } from "@/lib/marketplaces/ebay/active-search";
import { resolveAdapter } from "@/lib/marketplaces/live/resolve-adapter";
import { createMockAdapter } from "@/lib/marketplaces/mock/create-mock-adapter";
import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

const ebayActiveMockAdapter = createMockAdapter({
  id: "ebay",
  searchId: "ebay-active",
  label: "eBay",
  listingKind: "active",
  profile: {
    basePriceCents: 3400,
    priceSpread: 0.5,
    volume: { min: 20, max: 44 },
    currency: "USD",
    latencyMs: { min: 240, max: 750 },
  },
  buildSearchUrl: buildEbayActiveSearchUrl,
});

const ebayActiveLiveAdapter: MarketplaceAdapter = {
  id: "ebay",
  searchId: "ebay-active",
  label: "eBay",
  dataSource: "live",
  listingKind: "active",
  buildSearchUrl: buildEbayActiveSearchUrl,
  search: searchEbayActive,
};

export const ebayActiveAdapter = resolveAdapter(
  ebayActiveLiveAdapter,
  ebayActiveMockAdapter,
);
