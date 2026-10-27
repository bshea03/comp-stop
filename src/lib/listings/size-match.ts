import type { SoldListing } from "@/lib/marketplaces/types";

function normalizeSize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Word-boundary match so "M" does not hit "medium wash". */
function sizeAppearsInText(text: string, querySize: string): boolean {
  const normalizedText = normalizeSize(text);
  const normalizedQuery = normalizeSize(querySize);
  if (!normalizedQuery) return true;

  if (normalizedText === normalizedQuery) return true;

  const escaped = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|[\\s/\\-]|size\\s*)${escaped}(?:$|[\\s/\\-,])`,
    "i",
  );
  if (pattern.test(normalizedText)) return true;

  if (normalizedQuery.length >= 2) {
    if (normalizedText.includes(normalizedQuery)) return true;
  }

  return false;
}

function listingSizeFieldMatches(
  listingSize: string,
  querySize: string,
): boolean {
  const field = normalizeSize(listingSize);
  const query = normalizeSize(querySize);
  if (!query) return true;
  if (field === query) return true;
  if (field.includes(query) || query.includes(field)) {
    return Math.min(field.length, query.length) >= 2 || field.length <= 3;
  }
  return sizeAppearsInText(field, querySize);
}

export function listingMatchesQuerySize(
  listing: SoldListing,
  querySize: string,
): boolean {
  const trimmed = querySize.trim();
  if (!trimmed) return true;

  if (listing.size && listingSizeFieldMatches(listing.size, trimmed)) {
    return true;
  }

  return sizeAppearsInText(listing.title, trimmed);
}

export function filterListingsByQuerySize(
  listings: readonly SoldListing[],
  querySize: string | undefined,
): SoldListing[] {
  const trimmed = querySize?.trim();
  if (!trimmed) return [...listings];
  return listings.filter((listing) =>
    listingMatchesQuerySize(listing, trimmed),
  );
}
