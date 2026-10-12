import { createMockAdapter } from "@/lib/marketplaces/mock/create-mock-adapter";
import { buildPoshmarkSoldSearchUrl } from "@/lib/marketplaces/poshmark/build-search-url";

export const poshmarkMockAdapter = createMockAdapter({
  id: "poshmark",
  label: "Poshmark",
  profile: {
    basePriceCents: 3400,
    priceSpread: 0.4,
    volume: { min: 18, max: 40 },
    currency: "USD",
    latencyMs: { min: 300, max: 850 },
  },
  buildSearchUrl: buildPoshmarkSoldSearchUrl,
});
