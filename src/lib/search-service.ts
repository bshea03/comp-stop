import { unstable_cache } from "next/cache";
import { cache } from "react";
import { z } from "zod";

import { MARKETPLACE_ADAPTERS } from "@/lib/marketplaces/registry";
import type {
  MarketplaceAdapter,
  MarketplaceId,
  MarketplaceResult,
  SearchQuery,
  SoldListing,
} from "@/lib/marketplaces/types";
import { searchQuerySchema, soldListingSchema } from "@/lib/schema";
import { computePriceStats } from "@/lib/stats";

function adapterTimeoutMs(adapter: MarketplaceAdapter): number {
  if (process.env.USE_MOCK_MARKETPLACES === "1") return 10_000;
  // SoldComps fetches live eBay HTML; median latency is several seconds.
  if (adapter.id === "ebay" && adapter.listingKind === "sold") return 28_000;
  return 15_000;
}

const adapterResultSchema = z.array(soldListingSchema);

/** Reuse live adapter results across requests (helps free third-party quotas). */
function searchCacheRevalidateSeconds(): number | false {
  const raw = process.env.SEARCH_CACHE_REVALIDATE_SECONDS?.trim();
  if (raw === "0" || raw === "false") return false;
  const parsed = raw ? Number.parseInt(raw, 10) : 21_600;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 21_600;
}

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

  const cacheKey = `${adapter.id}:${queryKey(query)}`;
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
    const listings = adapterResultSchema.parse(raw);

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
 * Stable cache key for a search. `cache` compares arguments by identity, so a
 * string key keeps the memoization working even when callers parse the same
 * search params into separate objects. Undefined fields are dropped by
 * `JSON.stringify`, which is what the optional schema fields expect back.
 */
function queryKey(query: SearchQuery): string {
  return JSON.stringify({
    keywords: query.keywords,
    brand: query.brand,
    size: query.size,
    condition: query.condition,
    daysBack: query.daysBack,
    limit: query.limit,
  });
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
    return new Map(
      MARKETPLACE_ADAPTERS.map((adapter) => [
        adapter.id,
        runAdapter(adapter, parsed),
      ]),
    );
  },
);

/** Result for a single marketplace, for per-card streaming. */
export function searchMarketplace(
  marketplace: MarketplaceId,
  query: SearchQuery,
): Promise<MarketplaceResult> {
  const pending = startSearch(queryKey(query)).get(marketplace);
  if (!pending) {
    throw new Error(`No adapter registered for "${marketplace}".`);
  }
  return pending;
}

/** Results for every registered marketplace, in registry order. */
export function searchAllMarketplaces(
  query: SearchQuery,
): Promise<MarketplaceResult[]> {
  return Promise.all([...startSearch(queryKey(query)).values()]);
}

export const REGISTERED_MARKETPLACES: readonly {
  id: MarketplaceId;
  label: string;
}[] = MARKETPLACE_ADAPTERS.map(({ id, label }) => ({ id, label }));
