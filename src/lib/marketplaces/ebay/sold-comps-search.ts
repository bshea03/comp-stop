import { stripEnv } from "@/lib/env";
import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import { filterListingsByDaysBack } from "@/lib/marketplaces/live/filter-by-days";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

const SOLD_COMPS_API = "https://api.sold-comps.com/v1/scrape";
const MAX_PER_PAGE = 240;

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
  signal: AbortSignal,
): Promise<SoldCompsResponse> {
  const params = new URLSearchParams({
    keyword: keywordString(query),
    ebaySite: "ebay.com",
    count: String(Math.min(query.limit, MAX_PER_PAGE)),
    page: String(page),
  });

  const response = await fetch(`${SOLD_COMPS_API}?${params.toString()}`, {
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
    return JSON.parse(raw) as SoldCompsResponse;
  } catch {
    throw new Error("SoldComps API returned invalid JSON.");
  }
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

  const listings: SoldListing[] = [];
  let page = 1;
  let hasNextPage = true;

  while (listings.length < query.limit && hasNextPage && page <= 5) {
    const body = await fetchSoldCompsPage(apiKey, query, page, signal);

    for (const item of body.items ?? []) {
      const mapped = mapSoldCompsItem(item);
      if (mapped) listings.push(mapped);
      if (listings.length >= query.limit) break;
    }

    hasNextPage = body.hasNextPage === true;
    page += 1;
  }

  return filterListingsByDaysBack(listings, query.daysBack).slice(
    0,
    query.limit,
  );
}
