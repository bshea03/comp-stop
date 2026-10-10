import {
  generateMockListings,
  mockLatency,
  sleep,
  type MockProfile,
} from "@/lib/marketplaces/mock/generate-listings";
import type {
  MarketplaceAdapter,
  MarketplaceId,
  SearchQuery,
  SoldListing,
} from "@/lib/marketplaces/types";

/**
 * Shared body for the mock adapters. Each marketplace supplies only its price
 * profile and its real search URL, so replacing one with a live implementation
 * is a self-contained change in that marketplace's folder.
 */
export function createMockAdapter(config: {
  id: MarketplaceId;
  label: string;
  profile: MockProfile;
  buildSearchUrl: (query: SearchQuery) => string;
  /** Defaults to `buildSearchUrl`. Use when verify and per-listing links should differ. */
  buildListingUrl?: (query: SearchQuery) => string;
}): MarketplaceAdapter {
  const buildListingUrl = config.buildListingUrl ?? config.buildSearchUrl;

  return {
    id: config.id,
    label: config.label,
    dataSource: "mock",
    listingKind: "sold",
    buildSearchUrl: config.buildSearchUrl,
    async search(query: SearchQuery, signal: AbortSignal): Promise<SoldListing[]> {
      await sleep(mockLatency(config.id, query, config.profile), signal);
      return generateMockListings({
        marketplace: config.id,
        query,
        profile: config.profile,
        // Mock comps have no real item page, so each one links to the live
        // search on that marketplace instead of a URL that would 404.
        listingUrl: buildListingUrl(query),
      });
    },
  };
}

/** Builds a query string from the parts of a search a marketplace can filter on. */
export function keywordString(query: SearchQuery): string {
  return [query.brand, query.keywords, query.size]
    .filter((part): part is string => Boolean(part))
    .join(" ");
}
