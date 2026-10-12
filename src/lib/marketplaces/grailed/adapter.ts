import { buildGrailedSoldSearchUrl } from "@/lib/marketplaces/grailed/build-search-url";
import { searchGrailedSold } from "@/lib/marketplaces/grailed/live-search";
import { grailedMockAdapter } from "@/lib/marketplaces/grailed/mock-adapter";
import { resolveAdapter } from "@/lib/marketplaces/live/resolve-adapter";
import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

const grailedLiveAdapter: MarketplaceAdapter = {
  id: "grailed",
  label: "Grailed",
  dataSource: "live",
  listingKind: "sold",
  buildSearchUrl: buildGrailedSoldSearchUrl,
  search: searchGrailedSold,
};

export const grailedAdapter = resolveAdapter(
  grailedLiveAdapter,
  grailedMockAdapter,
);
