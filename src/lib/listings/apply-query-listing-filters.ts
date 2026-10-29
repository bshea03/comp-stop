import { filterListingsByQueryBrand } from "@/lib/listings/brand-match";
import { filterListingsByQueryCondition } from "@/lib/listings/condition-match";
import { filterListingsByQueryKeywords } from "@/lib/listings/keyword-match";
import { filterListingsByQuerySize } from "@/lib/listings/size-match";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

type ListingFilterStep = (
  listings: readonly SoldListing[],
  query: SearchQuery,
) => SoldListing[];

const LISTING_FILTER_PIPELINE: readonly ListingFilterStep[] = [
  (listings, query) => filterListingsByQueryBrand(listings, query.brand),
  (listings, query) => filterListingsByQuerySize(listings, query.size),
  (listings, query) =>
    filterListingsByQueryCondition(listings, query.condition),
  (listings, query) => filterListingsByQueryKeywords(listings, query.keywords),
];

/** Post-fetch filters shared by search orchestration and Poshmark pagination. */
export function applyQueryListingFilters(
  listings: readonly SoldListing[],
  query: SearchQuery,
): SoldListing[] {
  return LISTING_FILTER_PIPELINE.reduce(
    (acc, step) => step(acc, query),
    [...listings] as SoldListing[],
  );
}
