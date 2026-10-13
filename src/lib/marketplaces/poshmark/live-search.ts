import { poshmarkConditionLabel } from "@/lib/marketplaces/poshmark/condition-labels";
import {
  searchPoshmarkPostsPaginated,
  type PoshmarkPost,
} from "@/lib/marketplaces/poshmark/posts-api";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

function poshmarkListingUrl(id: string): string {
  return `https://poshmark.com/listing/${id}`;
}

function mapSoldPost(post: PoshmarkPost): SoldListing | null {
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
    condition: poshmarkConditionLabel(post.condition),
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
  return searchPoshmarkPostsPaginated(query, signal, {
    inventoryStatus: ["sold_out"],
    sortBy: "relevance",
    mapPost: mapSoldPost,
    restrictToDaysBack: true,
  });
}
