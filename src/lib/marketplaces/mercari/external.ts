import { MERCARI_LINK_OUT_MESSAGE } from "@/lib/marketplaces/mercari/mercari-mode";
import { buildMercariSoldSearchUrl } from "@/lib/marketplaces/mercari/build-search-url";
import type { MarketplaceResult, SearchQuery } from "@/lib/marketplaces/types";

export function mercariExternalResult(
  query: SearchQuery,
  options?: { devNote?: string; message?: string },
): MarketplaceResult {
  return {
    marketplace: "mercari",
    label: "Mercari",
    status: "external",
    dataSource: "live",
    listingKind: "sold",
    searchUrl: buildMercariSoldSearchUrl(query),
    listings: [],
    stats: null,
    externalMessage: options?.message ?? MERCARI_LINK_OUT_MESSAGE,
    devNote: options?.devNote,
  };
}
