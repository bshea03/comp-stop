import { buildMercariSoldSearchUrl } from "@/lib/marketplaces/mercari/build-search-url";
import { createMockAdapter } from "@/lib/marketplaces/mock/create-mock-adapter";

export const mercariMockAdapter = createMockAdapter({
  id: "mercari",
  label: "Mercari",
  profile: {
    basePriceCents: 2400,
    priceSpread: 0.48,
    volume: { min: 16, max: 36 },
    currency: "USD",
    latencyMs: { min: 280, max: 820 },
  },
  buildSearchUrl: buildMercariSoldSearchUrl,
});
