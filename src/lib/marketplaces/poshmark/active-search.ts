import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import { POSHMARK_CONDITION_FILTER } from "@/lib/marketplaces/poshmark/condition-filter";
import { poshmarkConditionLabel } from "@/lib/marketplaces/poshmark/condition-labels";
import { marketplaceFetch } from "@/lib/marketplaces/live/http";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

type PoshmarkPost = {
  id: string;
  title: string;
  brand?: string;
  condition?: string;
  price: number;
  cover_shot?: { url_small?: string; url?: string };
  inventory?: {
    status_changed_at?: string;
    size_quantities?: Array<{
      size_obj?: { display?: string };
    }>;
  };
};

type PoshmarkResponse = {
  data?: PoshmarkPost[];
};

function poshmarkListingUrl(id: string): string {
  return `https://poshmark.com/listing/${id}`;
}

function mapActivePost(post: PoshmarkPost): SoldListing | null {
  if (!post.id || !post.title) return null;

  const priceCents = Math.round(post.price * 100);
  if (priceCents <= 0) return null;

  const listedAtRaw = post.inventory?.status_changed_at;
  const soldAt = listedAtRaw
    ? new Date(listedAtRaw).toISOString()
    : new Date().toISOString();
  const size = post.inventory?.size_quantities?.[0]?.size_obj?.display;

  return {
    id: post.id,
    marketplace: "poshmark",
    title: post.title,
    brand: post.brand,
    size,
    condition: poshmarkConditionLabel(post.condition),
    priceCents,
    currency: "USD",
    soldAt,
    url: poshmarkListingUrl(post.id),
    imageUrl: post.cover_shot?.url_small ?? post.cover_shot?.url,
  };
}

/** Poshmark listings currently for sale (`inventory_status: available`). */
export async function searchPoshmarkActive(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  const conditionFilter =
    query.condition &&
    (POSHMARK_CONDITION_FILTER as Record<string, string[] | undefined>)[
      query.condition
    ];

  const request = {
    filters: {
      department: "All",
      inventory_status: ["available"],
      ...(conditionFilter ? { condition: conditionFilter } : {}),
    },
    query: keywordString(query),
    sort_by: "added_desc",
  };

  const url = `https://poshmark.com/vm-rest/posts?request=${encodeURIComponent(JSON.stringify(request))}&summarize=true&count=${Math.min(query.limit, 200)}`;

  const response = await marketplaceFetch(url, signal, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Poshmark returned HTTP ${response.status}.`);
  }

  const body = (await response.json()) as PoshmarkResponse;
  return (body.data ?? [])
    .map(mapActivePost)
    .filter((listing): listing is SoldListing => listing !== null)
    .slice(0, query.limit);
}
