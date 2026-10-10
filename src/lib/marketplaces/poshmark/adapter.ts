import { resolveAdapter } from "@/lib/marketplaces/live/resolve-adapter";
import { poshmarkMockAdapter } from "@/lib/marketplaces/poshmark/mock-adapter";
import { searchPoshmarkSold } from "@/lib/marketplaces/poshmark/live-search";
import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

/**
 * Live: Poshmark's web app reads sold listings from `GET /vm-rest/posts` with
 * `inventory_status[]=sold_out`. The endpoint is undocumented but reachable
 * without a session from server-side fetch.
 */
const poshmarkLiveAdapter: MarketplaceAdapter = {
  id: "poshmark",
  label: "Poshmark",
  dataSource: "live",
  listingKind: "sold",
  buildSearchUrl: poshmarkMockAdapter.buildSearchUrl,
  search: searchPoshmarkSold,
};

export const poshmarkAdapter = resolveAdapter(
  poshmarkLiveAdapter,
  poshmarkMockAdapter,
);
