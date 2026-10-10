import {
  DEPO_LINK_OUT_MESSAGE,
} from "@/lib/marketplaces/depop/depop-mode";
import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import type { MarketplaceResult, SearchQuery } from "@/lib/marketplaces/types";

export function buildDepopSearchUrl(query: SearchQuery): string {
  const params = new URLSearchParams({ q: keywordString(query) });
  return `https://www.depop.com/us/search/?${params.toString()}`;
}

/** Depop cannot be scraped reliably from cloud hosts; link out with the same query. */
export function depopExternalResult(
  query: SearchQuery,
  options?: { devNote?: string; message?: string },
): MarketplaceResult {
  return {
    marketplace: "depop",
    label: "Depop",
    status: "external",
    dataSource: "live",
    listingKind: "active",
    searchUrl: buildDepopSearchUrl(query),
    listings: [],
    stats: null,
    externalMessage: options?.message ?? DEPO_LINK_OUT_MESSAGE,
    devNote: options?.devNote,
  };
}
