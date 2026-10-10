import { stripEnv } from "@/lib/env";
import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import { filterListingsByDaysBack } from "@/lib/marketplaces/live/filter-by-days";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

const SOLD_COMPS_API = "https://api.sold-comps.com/v1/scrape";
const MAX_PER_PAGE = 240;
const SOLD_COMPS_JSON_PARSE_ATTEMPTS = 3;
const SOLD_COMPS_JSON_RETRY_DELAYS_MS = [500, 1_500];

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(
        signal.reason ?? new DOMException("Aborted", "AbortError"),
      );
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(
          signal.reason ?? new DOMException("Aborted", "AbortError"),
        );
      },
      { once: true },
    );
  });
}

function parseSoldCompsJson(raw: string): SoldCompsResponse {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("SoldComps API returned an empty body.");
  }
  return JSON.parse(trimmed) as SoldCompsResponse;
}

/** SoldComps scrapes eBay live — smaller requests finish faster. */
function ebaySoldCompsFetchLimit(query: SearchQuery): number {
  const raw = process.env.EBAY_SOLD_COMPS_MAX_LISTINGS?.trim();
  const cap = raw ? Number.parseInt(raw, 10) : 30;
  const resolved = Number.isFinite(cap) && cap > 0 ? cap : 30;
  return Math.min(query.limit, resolved, MAX_PER_PAGE);
}

function ebaySoldCompsMaxPages(): number {
  const raw = process.env.EBAY_SOLD_COMPS_MAX_PAGES?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 1;
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 5);
}

type SoldCompsItem = {
  itemId?: string;
  url?: string;
  title?: string;
  condition?: string;
  listingType?: string;
  endedAt?: string;
  soldPrice?: string;
  totalPrice?: string;
  soldCurrency?: string;
  thumbnailUrl?: string;
  fullResThumbnailUrl?: string;
};

type SoldCompsResponse = {
  items?: SoldCompsItem[];
  hasNextPage?: boolean;
  error?: string;
  message?: string;
};

function mapSoldCompsItem(item: SoldCompsItem): SoldListing | null {
  if (!item.itemId || !item.title || !item.url) return null;
  if (item.listingType && item.listingType !== "sold") return null;

  const dollars = item.totalPrice ?? item.soldPrice;
  if (!dollars) return null;

  const priceCents = Math.round(parseFloat(dollars) * 100);
  const currency = (item.soldCurrency ?? "USD").toUpperCase();
  if (currency.length !== 3) return null;

  const soldAt = item.endedAt
    ? new Date(`${item.endedAt}T23:59:59.000Z`).toISOString()
    : new Date().toISOString();

  return {
    id: item.itemId,
    marketplace: "ebay",
    title: item.title,
    condition: item.condition,
    priceCents,
    currency,
    soldAt,
    url: item.url,
    imageUrl: item.thumbnailUrl ?? item.fullResThumbnailUrl,
  };
}

async function fetchSoldCompsPage(
  apiKey: string,
  query: SearchQuery,
  page: number,
  perPage: number,
  signal: AbortSignal,
): Promise<SoldCompsResponse> {
  const params = new URLSearchParams({
    keyword: keywordString(query),
    ebaySite: "ebay.com",
    count: String(perPage),
    page: String(page),
  });
  const url = `${SOLD_COMPS_API}?${params.toString()}`;

  let lastParseError: Error | undefined;

  for (let attempt = 0; attempt < SOLD_COMPS_JSON_PARSE_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(
        SOLD_COMPS_JSON_RETRY_DELAYS_MS[attempt - 1] ?? 1_500,
        signal,
      );
    }

    const response = await fetch(url, {
      signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    const raw = await response.text();

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "SoldComps rejected the API key. Check SOLD_COMPS_API_KEY in the environment.",
      );
    }
    if (response.status === 429) {
      throw new Error(
        "SoldComps rate limit reached. Wait a minute or upgrade your SoldComps plan.",
      );
    }
    if (!response.ok) {
      throw new Error(
        `SoldComps API HTTP ${response.status}: ${raw.slice(0, 160)}`,
      );
    }

    try {
      return parseSoldCompsJson(raw);
    } catch (error) {
      lastParseError =
        error instanceof Error
          ? error
          : new Error("SoldComps API returned invalid JSON.");
      if (attempt < SOLD_COMPS_JSON_PARSE_ATTEMPTS - 1) {
        continue;
      }
    }
  }

  throw (
    lastParseError ??
    new Error("SoldComps API returned invalid JSON after retries.")
  );
}

/** eBay sold comps via https://sold-comps.com */
export async function searchEbaySoldComps(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  const apiKey = stripEnv(process.env.SOLD_COMPS_API_KEY);
  if (!apiKey) {
    throw new Error(
      "Add SOLD_COMPS_API_KEY from https://sold-comps.com (Dashboard → API key).",
    );
  }

  const fetchLimit = ebaySoldCompsFetchLimit(query);
  const maxPages = ebaySoldCompsMaxPages();
  const listings: SoldListing[] = [];
  let page = 1;
  let hasNextPage = true;

  while (listings.length < fetchLimit && hasNextPage && page <= maxPages) {
    const remaining = fetchLimit - listings.length;
    const perPage = Math.min(remaining, MAX_PER_PAGE);
    const body = await fetchSoldCompsPage(
      apiKey,
      query,
      page,
      perPage,
      signal,
    );

    for (const item of body.items ?? []) {
      const mapped = mapSoldCompsItem(item);
      if (mapped) listings.push(mapped);
      if (listings.length >= fetchLimit) break;
    }

    hasNextPage = body.hasNextPage === true;
    page += 1;
  }

  return filterListingsByDaysBack(listings, query.daysBack).slice(
    0,
    fetchLimit,
  );
}
