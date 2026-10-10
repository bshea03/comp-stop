import { resolveAdapter } from "@/lib/marketplaces/live/resolve-adapter";
import { searchVintedActive } from "@/lib/marketplaces/vinted/live-search";
import { vintedMockAdapter } from "@/lib/marketplaces/vinted/mock-adapter";
import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

/**
 * Live: Vinted catalog SSR HTML lists active items only; sold listings are removed.
 */
const vintedLiveAdapter: MarketplaceAdapter = {
  id: "vinted",
  label: "Vinted",
  dataSource: "live",
  listingKind: "active",
  resultCaveat:
    "Active listings only. Vinted does not publicly expose sold history.",
  buildSearchUrl: vintedMockAdapter.buildSearchUrl,
  search: searchVintedActive,
};

export const vintedAdapter = resolveAdapter(vintedLiveAdapter, vintedMockAdapter);
