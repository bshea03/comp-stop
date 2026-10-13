import type { SoldListing } from "@/lib/marketplaces/types";
import { classifyGarment } from "@/lib/marketplaces/mock/garment-image";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Words from the garment/keywords field (brand is handled separately). */
export function queryKeywordTokens(keywords: string): string[] {
  return keywords
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

/**
 * True when every keyword token appears as a whole word in the title.
 */
export function titleMatchesQueryKeywords(
  title: string,
  keywords: string,
): boolean {
  const tokens = queryKeywordTokens(keywords);
  if (tokens.length === 0) return true;

  const haystack = title.toLowerCase();

  return tokens.every((token) => {
    const needle = token.toLowerCase();
    const re = new RegExp(
      `(?:^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}(?:$|[^\\p{L}\\p{N}])`,
      "iu",
    );
    return re.test(haystack);
  });
}

/**
 * When the query names a garment type (e.g. shorts), drop listings whose title
 * clearly names a different type (e.g. tee). Otherwise Poshmark-style relevance
 * is kept — titles need not repeat every query word like "vintage".
 */
export function listingMatchesQueryKeywords(
  listing: SoldListing,
  keywords: string,
): boolean {
  const tokens = queryKeywordTokens(keywords);
  if (tokens.length === 0) return true;

  const queryKind = classifyGarment(keywords);
  if (queryKind !== "generic") {
    const titleKind = classifyGarment(listing.title);
    if (titleKind !== "generic" && titleKind !== queryKind) {
      return false;
    }
    return true;
  }

  return titleMatchesQueryKeywords(listing.title, keywords);
}

export function filterListingsByQueryKeywords(
  listings: readonly SoldListing[],
  keywords: string,
): SoldListing[] {
  const trimmed = keywords.trim();
  if (!trimmed) return [...listings];
  return listings.filter((listing) =>
    listingMatchesQueryKeywords(listing, trimmed),
  );
}
