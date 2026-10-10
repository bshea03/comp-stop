import { buildDepopSearchUrl } from "@/lib/marketplaces/depop/external";
import { createMockAdapter } from "@/lib/marketplaces/mock/create-mock-adapter";

export const depopMockAdapter = createMockAdapter({
  id: "depop",
  label: "Depop",
  profile: {
    basePriceCents: 2300,
    priceSpread: 0.58,
    volume: { min: 14, max: 34 },
    currency: "USD",
    latencyMs: { min: 240, max: 820 },
  },
  buildSearchUrl: buildDepopSearchUrl,
  buildListingUrl: buildDepopSearchUrl,
});
