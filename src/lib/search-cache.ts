import type { SearchQuery } from "@/lib/marketplaces/types";

/** Reuse live adapter results across requests (helps free third-party quotas). */
export function searchCacheRevalidateSeconds(): number | false {
  const raw = process.env.SEARCH_CACHE_REVALIDATE_SECONDS?.trim();
  if (raw === "0" || raw === "false") return false;
  const parsed = raw ? Number.parseInt(raw, 10) : 21_600;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 21_600;
}

/** Stable key for `unstable_cache` / request memoization from a parsed search query. */
export function searchQueryCacheKey(query: SearchQuery): string {
  return JSON.stringify({
    keywords: query.keywords,
    brand: query.brand,
    condition: query.condition,
    daysBack: query.daysBack,
    limit: query.limit,
  });
}
