import { unstable_cache } from "next/cache";
import { cache } from "react";
import { z } from "zod";

import { dedupeListingsById } from "@/lib/dedupe-listings";
import { runDepopMarketplace } from "@/lib/marketplaces/depop/run-depop";
import { MARKETPLACE_ADAPTERS } from "@/lib/marketplaces/registry";
import type {
  MarketplaceAdapter,
  MarketplaceId,
  MarketplaceResult,
  SearchQuery,
  SoldListing,
} from "@/lib/marketplaces/types";
import {
  searchCacheRevalidateSeconds,
  searchQueryCacheKey,
} from "@/lib/search-cache";
import { searchQuerySchema, soldListingSchema } from "@/lib/schema";
import { computePriceStats } from "@/lib/stats";

function adapterTimeoutMs(adapter: MarketplaceAdapter): number {
  if (process.env.USE_MOCK_MARKETPLACES === "1") return 10_000;
  // SoldComps fetches live eBay HTML; median latency is several seconds.
  if (adapter.id === "ebay" && adapter.listingKind === "sold") return 28_000;
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

  const cacheKey = `${adapter.id}:${searchQueryCacheKey(query)}`;
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
    const listings = dedupeListingsById(adapterResultSchema.parse(raw));

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

/**
 * Starts every adapter at once and memoizes the in-flight promises for the
 * duration of the request. The results grid and the comparison summary read
 * the same promises, so each marketplace is only searched once per request even
 * though they stream into separate Suspense boundaries.
 */
const startSearch = cache(
  (key: string): Map<MarketplaceId, Promise<MarketplaceResult>> => {
    const parsed = searchQuerySchema.parse(JSON.parse(key));
    const pending = new Map<MarketplaceId, Promise<MarketplaceResult>>(
      MARKETPLACE_ADAPTERS.map((adapter) => [
        adapter.id,
        runAdapter(adapter, parsed),
      ]),
    );
    pending.set("depop", runDepopMarketplace(parsed));
    return pending;
  },
);

/** Result for a single marketplace, for per-card streaming. */
export function searchMarketplace(
  marketplace: MarketplaceId,
  query: SearchQuery,
): Promise<MarketplaceResult> {
  const pending = startSearch(searchQueryCacheKey(query)).get(marketplace);
  if (!pending) {
    throw new Error(`No adapter registered for "${marketplace}".`);
  }
  return pending;
}

/** Results for every registered marketplace, in registry order. */
export function searchAllMarketplaces(
  query: SearchQuery,
): Promise<MarketplaceResult[]> {
  return Promise.all([...startSearch(searchQueryCacheKey(query)).values()]);
}

export const REGISTERED_MARKETPLACES: readonly {
  id: MarketplaceId;
  label: string;
}[] = [
  ...MARKETPLACE_ADAPTERS.map(({ id, label }) => ({ id, label })),
  { id: "depop", label: "Depop" },
];
