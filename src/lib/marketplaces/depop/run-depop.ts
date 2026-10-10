import { unstable_cache } from "next/cache";

import { dedupeListingsById } from "@/lib/dedupe-listings";
import {
  brightDataDepopSkipped,
  DEPO_BRIGHTDATA_KYC_DEV_NOTE,
  depopLinkOutOnly,
  markBrightDataDepopUnavailable,
} from "@/lib/marketplaces/depop/depop-mode";
import { depopExternalResult } from "@/lib/marketplaces/depop/external";
import { searchDepopViaBrightData } from "@/lib/marketplaces/depop/brightdata-search";
import { depopMockAdapter } from "@/lib/marketplaces/depop/mock-adapter";
import { BrightDataFallbackError } from "@/lib/marketplaces/live/brightdata-unlocker";
import { brightDataUnlockerConfigured } from "@/lib/marketplaces/live/brightdata-unlocker";
import type { MarketplaceResult, SearchQuery, SoldListing } from "@/lib/marketplaces/types";
import {
  searchCacheRevalidateSeconds,
  searchQueryCacheKey,
} from "@/lib/search-cache";
import { soldListingSchema } from "@/lib/schema";
import { computePriceStats } from "@/lib/stats";
import { z } from "zod";

const listingSchema = z.array(soldListingSchema);

const DEPO_BASE = {
  marketplace: "depop" as const,
  label: "Depop",
  listingKind: "active" as const,
  resultCaveat:
    "Active listings only. Sold items are not keyword-searchable on Depop.",
};

function depopExternal(query: SearchQuery, devNote?: string) {
  return depopExternalResult(query, { devNote });
}

function isBrightDataKycBlock(message: string): boolean {
  return /policy_20050|requires special permission|complete KYC/i.test(message);
}

function depopTimeoutMs(): number {
  const renderOn =
    process.env.BRIGHTDATA_RENDER?.trim().toLowerCase() !== "false" &&
    process.env.BRIGHTDATA_RENDER?.trim() !== "0";
  return renderOn ? 45_000 : 18_000;
}

async function mockDepopListings(query: SearchQuery): Promise<SoldListing[]> {
  return depopMockAdapter.search(query, AbortSignal.timeout(10_000));
}

async function liveDepopListings(query: SearchQuery): Promise<SoldListing[]> {
  const run = () =>
    searchDepopViaBrightData(query, AbortSignal.timeout(depopTimeoutMs()));

  const revalidate = searchCacheRevalidateSeconds();
  if (revalidate === false) return run();

  return unstable_cache(run, ["depop-brightdata", searchQueryCacheKey(query)], {
    revalidate,
  })();
}

function liveResult(
  query: SearchQuery,
  listings: SoldListing[],
): MarketplaceResult {
  return {
    ...DEPO_BASE,
    dataSource: "live",
    status: listings.length > 0 ? "ok" : "empty",
    searchUrl: depopMockAdapter.buildSearchUrl(query),
    listings,
    stats: computePriceStats(listings),
  };
}

function shouldUseDepopLinkOut(): boolean {
  return (
    depopLinkOutOnly() ||
    brightDataDepopSkipped() ||
    !brightDataUnlockerConfigured()
  );
}

/**
 * Depop: link-out by default; optional Bright Data when DEPO_LINK_OUT=0 and approved.
 */
export async function runDepopMarketplace(
  query: SearchQuery,
): Promise<MarketplaceResult> {
  const searchUrl = depopMockAdapter.buildSearchUrl(query);

  if (process.env.USE_MOCK_MARKETPLACES === "1") {
    try {
      const listings = dedupeListingsById(
        listingSchema.parse(await mockDepopListings(query)),
      );
      return {
        ...DEPO_BASE,
        dataSource: "mock",
        status: listings.length > 0 ? "ok" : "empty",
        searchUrl,
        listings,
        stats: computePriceStats(listings),
      };
    } catch (error) {
      return {
        ...DEPO_BASE,
        dataSource: "mock",
        status: "error",
        searchUrl,
        listings: [],
        stats: null,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  if (shouldUseDepopLinkOut()) {
    return depopExternal(query);
  }

  try {
    const listings = dedupeListingsById(
      listingSchema.parse(await liveDepopListings(query)),
    );
    return liveResult(query, listings);
  } catch (error) {
    if (error instanceof BrightDataFallbackError) {
      if (isBrightDataKycBlock(error.message)) {
        markBrightDataDepopUnavailable();
      }
      const devNote =
        process.env.NODE_ENV === "development"
          ? isBrightDataKycBlock(error.message)
            ? DEPO_BRIGHTDATA_KYC_DEV_NOTE
            : error.message
          : undefined;
      if (devNote) console.warn("[depop]", devNote);
      return depopExternal(query, devNote);
    }
    if (error instanceof z.ZodError) {
      const devNote =
        process.env.NODE_ENV === "development"
          ? "Depop listings failed validation after fetch."
          : undefined;
      return depopExternal(query, devNote);
    }
    if (error instanceof DOMException && error.name === "TimeoutError") {
      const devNote =
        process.env.NODE_ENV === "development"
          ? "Depop fetch timed out via Bright Data."
          : undefined;
      return depopExternal(query, devNote);
    }
    return {
      ...DEPO_BASE,
      dataSource: "live",
      status: "error",
      searchUrl,
      listings: [],
      stats: null,
      error: error instanceof Error ? error.message : "Unknown error.",
    };
  }
}
