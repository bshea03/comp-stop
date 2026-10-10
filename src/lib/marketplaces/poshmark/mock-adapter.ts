import {
  createMockAdapter,
  keywordString,
} from "@/lib/marketplaces/mock/create-mock-adapter";

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
  buildSearchUrl: (query) => {
    const params = new URLSearchParams({
      query: keywordString(query),
      availability: "sold_out",
    });
    return `https://poshmark.com/search?${params.toString()}`;
  },
});
