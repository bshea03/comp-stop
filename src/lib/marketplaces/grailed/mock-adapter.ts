import { buildGrailedSoldSearchUrl } from "@/lib/marketplaces/grailed/build-search-url";
import { createMockAdapter } from "@/lib/marketplaces/mock/create-mock-adapter";

export const grailedMockAdapter = createMockAdapter({
  id: "grailed",
  label: "Grailed",
  profile: {
    basePriceCents: 8500,
    priceSpread: 0.55,
    volume: { min: 12, max: 28 },
    currency: "USD",
    latencyMs: { min: 320, max: 900 },
  },
  buildSearchUrl: buildGrailedSoldSearchUrl,
});
