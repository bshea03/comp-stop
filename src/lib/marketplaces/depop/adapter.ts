import { searchDepopActive } from "@/lib/marketplaces/depop/live-search";
import { depopMockAdapter } from "@/lib/marketplaces/depop/mock-adapter";
import { resolveAdapter } from "@/lib/marketplaces/live/resolve-adapter";
import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

/**
 * Live: Depop search page SSR (active listings). Sold items are not keyword-searchable.
 */
const depopLiveAdapter: MarketplaceAdapter = {
  id: "depop",
  label: "Depop",
  dataSource: "live",
  listingKind: "active",
  resultCaveat:
    "Active listings only. Depop does not publicly expose sold history.",
  buildSearchUrl: depopMockAdapter.buildSearchUrl,
  search: searchDepopActive,
};

export const depopAdapter = resolveAdapter(depopLiveAdapter, depopMockAdapter);
