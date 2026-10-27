import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import { applyQueryListingFilters } from "@/lib/listings/apply-query-listing-filters";
import { filterListingsByDaysBack } from "@/lib/marketplaces/live/filter-by-days";
import { marketplaceFetch } from "@/lib/marketplaces/live/http";
import { POSHMARK_CONDITION_FILTER } from "@/lib/marketplaces/poshmark/condition-filter";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

/** Poshmark returns at most 40 posts per vm-rest response regardless of `count`. */
export const POSHMARK_POSTS_PAGE_SIZE = 40;

/** Cap pagination so a noisy query cannot fan out indefinitely. */
export const POSHMARK_MAX_PAGES = 15;

export type PoshmarkPost = {
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

type PoshmarkPostsRequest = {
  filters: {
    department: string;
    inventory_status: string[];
    condition?: string[];
    size?: string[];
  };
  query: string;
  sort_by: string;
  max_id?: string;
};

type PoshmarkPostsResponse = {
  data?: PoshmarkPost[];
  more?: {
    next_max_id?: string;
    is_next_max_id_present?: boolean;
  };
};

function buildPostsRequest(
  query: SearchQuery,
  inventoryStatus: string[],
  sortBy: string,
  maxId?: string,
): PoshmarkPostsRequest {
  const conditionFilter =
    query.condition &&
    (POSHMARK_CONDITION_FILTER as Record<string, string[] | undefined>)[
      query.condition
    ];

  return {
    filters: {
      department: "All",
      inventory_status: inventoryStatus,
      ...(conditionFilter ? { condition: conditionFilter } : {}),
      ...(query.size ? { size: [query.size] } : {}),
    },
    query: keywordString(query),
    sort_by: sortBy,
    ...(maxId ? { max_id: maxId } : {}),
  };
}

async function fetchPoshmarkPostsPage(
  request: PoshmarkPostsRequest,
  signal: AbortSignal,
): Promise<PoshmarkPostsResponse> {
  const url = `https://poshmark.com/vm-rest/posts?request=${encodeURIComponent(JSON.stringify(request))}&summarize=true&count=${POSHMARK_POSTS_PAGE_SIZE}`;

  const response = await marketplaceFetch(url, signal, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Poshmark returned HTTP ${response.status}.`);
  }

  return (await response.json()) as PoshmarkPostsResponse;
}

/**
 * Walks Poshmark search pages until enough comps pass our filters, matching how
 * the site loads more than the first API batch.
 */
export async function searchPoshmarkPostsPaginated(
  query: SearchQuery,
  signal: AbortSignal,
  options: {
    inventoryStatus: string[];
    sortBy: string;
    mapPost: (post: PoshmarkPost) => SoldListing | null;
    /** When true, only listings within `query.daysBack` are kept (sold comps). */
    restrictToDaysBack?: boolean;
  },
): Promise<SoldListing[]> {
  const seenIds = new Set<string>();
  const mappedPool: SoldListing[] = [];
  let request = buildPostsRequest(
    query,
    options.inventoryStatus,
    options.sortBy,
  );

  for (let page = 0; page < POSHMARK_MAX_PAGES; page += 1) {
    const body = await fetchPoshmarkPostsPage(request, signal);
    const batch = body.data ?? [];

    for (const post of batch) {
      const listing = options.mapPost(post);
      if (!listing || seenIds.has(listing.id)) continue;
      seenIds.add(listing.id);
      mappedPool.push(listing);
    }

    const timeFiltered = options.restrictToDaysBack
      ? filterListingsByDaysBack(mappedPool, query.daysBack)
      : mappedPool;
    const filtered = applyQueryListingFilters(timeFiltered, query);

    if (filtered.length >= query.limit) {
      return filtered.slice(0, query.limit);
    }

    const nextMaxId = body.more?.next_max_id;
    if (!nextMaxId || batch.length === 0) break;

    request = buildPostsRequest(
      query,
      options.inventoryStatus,
      options.sortBy,
      nextMaxId,
    );
  }

  const timeFiltered = options.restrictToDaysBack
    ? filterListingsByDaysBack(mappedPool, query.daysBack)
    : mappedPool;
  return applyQueryListingFilters(timeFiltered, query).slice(0, query.limit);
}
