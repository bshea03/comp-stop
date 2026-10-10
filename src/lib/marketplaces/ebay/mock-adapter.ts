import {
  buildEbayActiveSearchUrl,
  buildEbaySoldSearchUrl,
} from "@/lib/marketplaces/ebay/build-search-url";
import { createMockAdapter } from "@/lib/marketplaces/mock/create-mock-adapter";

export const ebayMockAdapter = createMockAdapter({
  id: "ebay",
  label: "eBay",
  profile: {
    basePriceCents: 3200,
    priceSpread: 0.52,
    volume: { min: 24, max: 48 },
    currency: "USD",
    latencyMs: { min: 220, max: 700 },
  },
  buildSearchUrl: buildEbaySoldSearchUrl,
  buildListingUrl: buildEbayActiveSearchUrl,
});
