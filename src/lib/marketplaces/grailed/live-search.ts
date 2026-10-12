import { grailedItemPriceCents } from "@/lib/listings/item-price-cents";
import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import {
  grailedAlgoliaApiKey,
  grailedAlgoliaAppId,
  grailedAlgoliaMultiQueryUrl,
} from "@/lib/marketplaces/grailed/algolia-config";
import { filterListingsByDaysBack } from "@/lib/marketplaces/live/filter-by-days";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

type GrailedAlgoliaHit = {
  id?: number;
  title?: string;
  designer_names?: string;
  size?: string;
  condition?: string;
  sold_price?: number;
  sold_shipping_price?: number;
  sold_price_includes_shipping?: boolean | null;
  sold_at?: string;
  sold_at_i?: number;
  cover_photo?: { url?: string; image_url?: string };
};

type GrailedAlgoliaResult = {
  hits?: GrailedAlgoliaHit[];
};

function grailedFetchLimit(query: SearchQuery): number {
  const raw = process.env.GRAILED_MAX_LISTINGS?.trim();
  const cap = raw ? Number.parseInt(raw, 10) : 24;
  const resolved = Number.isFinite(cap) && cap > 0 ? cap : 24;
  return Math.min(query.limit, resolved, 40);
}

function mapGrailedHit(hit: GrailedAlgoliaHit): SoldListing | null {
  if (!hit.id || !hit.title) return null;
  const priceCents = grailedItemPriceCents(hit);
  if (priceCents == null) return null;

  const soldAt =
    hit.sold_at != null
      ? new Date(hit.sold_at).toISOString()
      : hit.sold_at_i != null
        ? new Date(hit.sold_at_i * 1000).toISOString()
        : new Date().toISOString();

  const imageUrl = hit.cover_photo?.url ?? hit.cover_photo?.image_url;

  return {
    id: String(hit.id),
    marketplace: "grailed",
    title: hit.title,
    brand: hit.designer_names?.trim() || undefined,
    size: hit.size?.trim() || undefined,
    condition: hit.condition,
    priceCents,
    currency: "USD",
    soldAt,
    url: `https://www.grailed.com/listings/${hit.id}`,
    imageUrl,
  };
}

/** Grailed sold comps via the public Algolia `Listing_sold_production` index. */
export async function searchGrailedSold(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  const appId = grailedAlgoliaAppId();
  const apiKey = grailedAlgoliaApiKey();
  const limit = grailedFetchLimit(query);
  const keyword = keywordString(query);

  const params = new URLSearchParams({
    query: keyword,
    hitsPerPage: String(limit),
    page: "0",
  });

  const response = await fetch(grailedAlgoliaMultiQueryUrl(appId), {
    method: "POST",
    signal,
    headers: {
      "X-Algolia-Application-Id": appId,
      "X-Algolia-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          indexName: "Listing_sold_production",
          params: params.toString(),
        },
      ],
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(
      `Grailed search HTTP ${response.status}: ${raw.slice(0, 160)}`,
    );
  }

  let json: { results?: GrailedAlgoliaResult[] };
  try {
    json = JSON.parse(raw) as { results?: GrailedAlgoliaResult[] };
  } catch {
    throw new Error("Grailed returned invalid JSON.");
  }

  const hits = json.results?.[0]?.hits ?? [];
  const listings = hits
    .map(mapGrailedHit)
    .filter((listing): listing is SoldListing => listing !== null);

  return filterListingsByDaysBack(listings, query.daysBack).slice(0, limit);
}
