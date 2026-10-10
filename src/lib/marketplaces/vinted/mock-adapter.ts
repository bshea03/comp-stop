import {
  createMockAdapter,
  keywordString,
} from "@/lib/marketplaces/mock/create-mock-adapter";

export const vintedMockAdapter = createMockAdapter({
  id: "vinted",
  label: "Vinted",
  profile: {
    basePriceCents: 1900,
    priceSpread: 0.45,
    volume: { min: 20, max: 44 },
    currency: "USD",
    latencyMs: { min: 260, max: 780 },
  },
  buildSearchUrl: (query) => {
    const params = new URLSearchParams({ search_text: keywordString(query) });
    return `https://www.vinted.com/catalog?${params.toString()}`;
  },
});
