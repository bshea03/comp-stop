import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import { filterListingsByDaysBack } from "@/lib/marketplaces/live/filter-by-days";
import { marketplaceFetch } from "@/lib/marketplaces/live/http";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

const POSHMARK_CONDITION: Record<string, string> = {
  nwt: "New with tags",
  nwot: "New without tags",
  uln: "Used like new",
  ret: "Retail",
  wlsl: "Wholesale",
};

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

function mapPost(post: PoshmarkPost): SoldListing | null {
  const soldAtRaw = post.inventory?.status_changed_at;
  if (!soldAtRaw) return null;

  const soldAt = new Date(soldAtRaw).toISOString();
  const size = post.inventory?.size_quantities?.[0]?.size_obj?.display;
  const priceCents = Math.round(post.price * 100);

  return {
    id: post.id,
    marketplace: "poshmark",
    title: post.title,
    brand: post.brand,
    size,
    condition: post.condition
      ? POSHMARK_CONDITION[post.condition] ?? post.condition
      : undefined,
    priceCents,
    currency: "USD",
    soldAt,
    url: poshmarkListingUrl(post.id),
    imageUrl: post.cover_shot?.url_small ?? post.cover_shot?.url,
  };
}

export async function searchPoshmarkSold(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  const request = {
    filters: {
      department: "All",
      inventory_status: ["sold_out"],
      ...(query.size ? { size: [query.size] } : {}),
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
  const mapped = (body.data ?? [])
    .map(mapPost)
    .filter((listing): listing is SoldListing => listing !== null);

  return filterListingsByDaysBack(mapped, query.daysBack).slice(0, query.limit);
}
