import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import { filterListingsByDaysBack } from "@/lib/marketplaces/live/filter-by-days";
import { marketplaceFetch } from "@/lib/marketplaces/live/http";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

type MercariItem = {
  id?: string;
  name?: string;
  price?: number;
  status?: string;
  itemCondition?: { name?: string };
  itemBrand?: { name?: string };
  itemSize?: { name?: string };
  photos?: Array<{ thumbnail?: string; imageUrl?: string }>;
  updated?: number;
  created?: number;
};

type MercariSearchResponse = {
  data?: MercariItem[];
  items?: MercariItem[];
  errors?: Array<{ message?: string; status?: number }>;
};

function mercariFetchLimit(query: SearchQuery): number {
  const raw = process.env.MERCARI_MAX_LISTINGS?.trim();
  const cap = raw ? Number.parseInt(raw, 10) : 24;
  const resolved = Number.isFinite(cap) && cap > 0 ? cap : 24;
  return Math.min(query.limit, resolved, 48);
}

function mapMercariItem(item: MercariItem): SoldListing | null {
  if (!item.id || !item.name) return null;
  if (item.status && item.status !== "sold_out") return null;

  const price = item.price;
  if (price == null || !Number.isFinite(price)) return null;

  const soldAtMs = item.updated ?? item.created;
  const soldAt =
    soldAtMs != null
      ? new Date(soldAtMs * 1000).toISOString()
      : new Date().toISOString();

  const photo = item.photos?.[0];

  return {
    id: item.id,
    marketplace: "mercari",
    title: item.name,
    brand: item.itemBrand?.name,
    size: item.itemSize?.name,
    condition: item.itemCondition?.name,
    priceCents: Math.round(price),
    currency: "USD",
    soldAt,
    url: `https://www.mercari.com/us/item/${item.id}/`,
    imageUrl: photo?.imageUrl ?? photo?.thumbnail,
  };
}

/**
 * Mercari US sold search via `GET /v1/api/search`. Requires session headers from
 * the web app; often blocked from cloud hosts (401/403).
 */
export async function searchMercariSold(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  const limit = mercariFetchLimit(query);
  const params = new URLSearchParams({
    keyword: keywordString(query),
    status: "sold_out",
    limit: String(limit),
    offset: "0",
  });

  const url = `https://www.mercari.com/v1/api/search?${params.toString()}`;
  const response = await marketplaceFetch(url, signal, {
    headers: {
      Accept: "application/json",
      "x-platform": "web",
    },
  });

  const raw = await response.text();

  if (
    response.status === 401 ||
    response.status === 403 ||
    /just a moment|cf-browser-verification/i.test(raw)
  ) {
    throw new Error(
      "Mercari blocked this server request (Cloudflare or session).",
    );
  }
  if (!response.ok) {
    throw new Error(
      `Mercari search HTTP ${response.status}: ${raw.slice(0, 160)}`,
    );
  }

  let body: MercariSearchResponse;
  try {
    body = JSON.parse(raw) as MercariSearchResponse;
  } catch {
    throw new Error("Mercari returned invalid JSON.");
  }

  if (body.errors?.length) {
    throw new Error(
      body.errors[0]?.message ?? "Mercari search was unauthorized.",
    );
  }

  const rows = body.data ?? body.items ?? [];
  const listings = rows
    .map(mapMercariItem)
    .filter((listing): listing is SoldListing => listing !== null);

  return filterListingsByDaysBack(listings, query.daysBack).slice(0, limit);
}
