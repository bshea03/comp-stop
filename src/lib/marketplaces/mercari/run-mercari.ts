import { dedupeListingsById } from "@/lib/dedupe-listings";
import { mercariExternalResult } from "@/lib/marketplaces/mercari/external";
import { searchMercariSold } from "@/lib/marketplaces/mercari/live-search";
import { mercariLinkOutOnly } from "@/lib/marketplaces/mercari/mercari-mode";
import { mercariMockAdapter } from "@/lib/marketplaces/mercari/mock-adapter";
import type { MarketplaceResult, SearchQuery } from "@/lib/marketplaces/types";
import { soldListingSchema } from "@/lib/schema";
import { computePriceStats } from "@/lib/stats";
import { z } from "zod";

const listingSchema = z.array(soldListingSchema);

const MERCARI_BASE = {
  marketplace: "mercari" as const,
  label: "Mercari",
  listingKind: "sold" as const,
};

function mercariTimeoutMs(): number {
  return 15_000;
}

function isMercariBlockedMessage(message: string): boolean {
  return /blocked|unauthorized|cloudflare|just a moment|403|401/i.test(
    message,
  );
}

export async function runMercariMarketplace(
  query: SearchQuery,
): Promise<MarketplaceResult> {
  const searchUrl = mercariMockAdapter.buildSearchUrl(query);

  if (process.env.USE_MOCK_MARKETPLACES === "1") {
    try {
      const listings = dedupeListingsById(
        listingSchema.parse(
          await mercariMockAdapter.search(
            query,
            AbortSignal.timeout(10_000),
          ),
        ),
      );
      return {
        ...MERCARI_BASE,
        dataSource: "mock",
        status: listings.length > 0 ? "ok" : "empty",
        searchUrl,
        listings,
        stats: computePriceStats(listings),
      };
    } catch (error) {
      return {
        ...MERCARI_BASE,
        dataSource: "mock",
        status: "error",
        searchUrl,
        listings: [],
        stats: null,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  if (mercariLinkOutOnly()) {
    return mercariExternalResult(query);
  }

  try {
    const listings = dedupeListingsById(
      listingSchema.parse(
        await searchMercariSold(query, AbortSignal.timeout(mercariTimeoutMs())),
      ),
    );
    return {
      ...MERCARI_BASE,
      dataSource: "live",
      status: listings.length > 0 ? "ok" : "empty",
      searchUrl,
      listings,
      stats: computePriceStats(listings),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    if (isMercariBlockedMessage(message)) {
      const devNote =
        process.env.NODE_ENV === "development"
          ? "Live Mercari fetch failed (Cloudflare). Keep MERCARI_LINK_OUT=1 or use the link below."
          : undefined;
      return mercariExternalResult(query, { devNote });
    }
    return {
      ...MERCARI_BASE,
      dataSource: "live",
      status: "error",
      searchUrl,
      listings: [],
      stats: null,
      error: message,
    };
  }
}
