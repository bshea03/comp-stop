import { resolveAdapter } from "@/lib/marketplaces/live/resolve-adapter";
import { searchPoshmarkActive } from "@/lib/marketplaces/poshmark/active-search";
import { buildPoshmarkActiveSearchUrl } from "@/lib/marketplaces/poshmark/build-search-url";
import { createMockAdapter } from "@/lib/marketplaces/mock/create-mock-adapter";
import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

const poshmarkActiveMockAdapter = createMockAdapter({
  id: "poshmark",
  searchId: "poshmark-active",
  label: "Poshmark",
  listingKind: "active",
  profile: {
    basePriceCents: 3600,
    priceSpread: 0.42,
    volume: { min: 16, max: 36 },
    currency: "USD",
    latencyMs: { min: 280, max: 800 },
  },
  buildSearchUrl: buildPoshmarkActiveSearchUrl,
});

const poshmarkActiveLiveAdapter: MarketplaceAdapter = {
  id: "poshmark",
  searchId: "poshmark-active",
  label: "Poshmark",
  dataSource: "live",
  listingKind: "active",
  buildSearchUrl: buildPoshmarkActiveSearchUrl,
  search: searchPoshmarkActive,
};

export const poshmarkActiveAdapter = resolveAdapter(
  poshmarkActiveLiveAdapter,
  poshmarkActiveMockAdapter,
);
