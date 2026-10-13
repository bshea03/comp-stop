import { filterListingsByQueryBrand } from "@/lib/listings/brand-match";
import { filterListingsByQueryCondition } from "@/lib/listings/condition-match";
import { filterListingsByQueryKeywords } from "@/lib/listings/keyword-match";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

/** Post-fetch filters shared by search orchestration and Poshmark pagination. */
export function applyQueryListingFilters(
  listings: readonly SoldListing[],
  query: SearchQuery,
): SoldListing[] {
  return filterListingsByQueryKeywords(
    filterListingsByQueryCondition(
      filterListingsByQueryBrand(listings, query.brand),
      query.condition,
    ),
    query.keywords,
  );
}
