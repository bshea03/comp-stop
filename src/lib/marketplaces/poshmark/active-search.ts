import { poshmarkConditionLabel } from "@/lib/marketplaces/poshmark/condition-labels";
import {
  searchPoshmarkPostsPaginated,
  type PoshmarkPost,
} from "@/lib/marketplaces/poshmark/posts-api";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

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
  return searchPoshmarkPostsPaginated(query, signal, {
    inventoryStatus: ["available"],
    sortBy: "relevance",
    mapPost: mapActivePost,
  });
}
