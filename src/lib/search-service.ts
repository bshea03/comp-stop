import { unstable_cache } from "next/cache";
import { cache } from "react";
import { z } from "zod";

import { dedupeListingsById } from "@/lib/dedupe-listings";
import { applyQueryListingFilters } from "@/lib/listings/apply-query-listing-filters";
import { runDepopMarketplace } from "@/lib/marketplaces/depop/run-depop";
import { runMercariMarketplace } from "@/lib/marketplaces/mercari/run-mercari";
import {
  EXTRA_MARKETPLACE_ADAPTERS,
  MARKETPLACE_ADAPTERS,
} from "@/lib/marketplaces/registry";
import type {
  MarketplaceAdapter,
  MarketplaceResult,
  PanelSearchId,
  SearchQuery,
  SoldListing,
} from "@/lib/marketplaces/types";
import { PANEL_SEARCH_IDS } from "@/lib/marketplaces/marketplace-panels";
import {
  searchCacheRevalidateSeconds,
  searchQueryCacheKey,
} from "@/lib/search-cache";
import { searchQuerySchema, soldListingSchema } from "@/lib/schema";
import { computePriceStats } from "@/lib/stats";

function adapterSearchId(adapter: MarketplaceAdapter): PanelSearchId {
  return adapter.searchId ?? adapter.id;
}

const ALL_REGISTRY_ADAPTERS: readonly MarketplaceAdapter[] = [
  ...MARKETPLACE_ADAPTERS,
  ...EXTRA_MARKETPLACE_ADAPTERS,
];

function adapterTimeoutMs(adapter: MarketplaceAdapter): number {
  if (process.env.USE_MOCK_MARKETPLACES === "1") return 10_000;
  // SoldComps fetches live eBay HTML; median latency is several seconds.
  if (adapter.id === "ebay") return 28_000;
  if (adapter.id === "grailed") return 20_000;
  if (adapter.id === "poshmark") return 25_000;
  return 15_000;
}

const adapterResultSchema = z.array(soldListingSchema);

async function invokeAdapterSearch(
  adapter: MarketplaceAdapter,
  query: SearchQuery,
): Promise<SoldListing[]> {
  const timeoutMs = adapterTimeoutMs(adapter);
  const run = () =>
    adapter.search(query, AbortSignal.timeout(timeoutMs));

  if (adapter.dataSource === "mock") return run();

  const revalidate = searchCacheRevalidateSeconds();
  if (revalidate === false) return run();

  const cacheKey = `${adapterSearchId(adapter)}:${searchQueryCacheKey(query)}`;
  return unstable_cache(run, ["marketplace-listings", cacheKey], {
    revalidate,
  })();
}

function errorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return "Returned listings in an unexpected shape.";
  }
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "No response before the adapter timeout.";
  }
  if (error instanceof Error) return error.message;
  return "Unknown error.";
}

/**
 * Runs one adapter and converts whatever happens into a `MarketplaceResult`.
 * This never rejects: a marketplace that times out or returns garbage becomes
 * one error card while the other three still render.
 */
async function runAdapter(
  adapter: MarketplaceAdapter,
  query: SearchQuery,
): Promise<MarketplaceResult> {
  const base = {
    marketplace: adapter.id,
    label: adapter.label,
    dataSource: adapter.dataSource,
    listingKind: adapter.listingKind,
    resultCaveat: adapter.resultCaveat,
    searchUrl: adapter.buildSearchUrl(query),
  } as const;

  try {
    const raw = await invokeAdapterSearch(adapter, query);
    const parsed = dedupeListingsById(adapterResultSchema.parse(raw));
    const listings = applyQueryListingFilters(parsed, query);

    return {
      ...base,
      status: listings.length > 0 ? "ok" : "empty",
      listings,
      stats: computePriceStats(listings),
    };
  } catch (error) {
    return {
      ...base,
      status: "error",
      listings: [],
      stats: null,
      error: errorMessage(error),
    };
  }
}

function runPanelSearch(
  searchId: PanelSearchId,
  query: SearchQuery,
): Promise<MarketplaceResult> {
  if (searchId === "mercari") return runMercariMarketplace(query);
  if (searchId === "depop") return runDepopMarketplace(query);

  const adapter = ALL_REGISTRY_ADAPTERS.find(
    (entry) => adapterSearchId(entry) === searchId,
  );
  if (!adapter) {
    throw new Error(`No adapter registered for "${searchId}".`);
  }
  return runAdapter(adapter, query);
}

/**
 * Memoizes in-flight work per (query, panel). Only panels that are actually
 * requested start a fetch — hidden shops never hit the network.
 */
const cachedPanelSearch = cache(
  (queryKey: string, searchId: PanelSearchId): Promise<MarketplaceResult> => {
    const query = searchQuerySchema.parse(JSON.parse(queryKey));
    return runPanelSearch(searchId, query);
  },
);

/** Result for a single marketplace, for per-card streaming. */
export function searchMarketplace(
  searchId: PanelSearchId,
  query: SearchQuery,
): Promise<MarketplaceResult> {
  return cachedPanelSearch(searchQueryCacheKey(query), searchId);
}

/** Results for the given panels (defaults to every registered panel). */
export function searchAllMarketplaces(
  query: SearchQuery,
  searchIds: readonly PanelSearchId[] = PANEL_SEARCH_IDS,
): Promise<MarketplaceResult[]> {
  const queryKey = searchQueryCacheKey(query);
  return Promise.all(
    searchIds.map((searchId) => cachedPanelSearch(queryKey, searchId)),
  );
}

export {
  ALL_MARKETPLACE_PANELS,
  ALL_MARKETPLACE_PANELS as REGISTERED_MARKETPLACES,
  DATA_MARKETPLACE_PANELS,
  LINK_OUT_MARKETPLACE_PANELS,
} from "@/lib/marketplaces/marketplace-panels";
