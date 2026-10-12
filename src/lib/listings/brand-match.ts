import type { SoldListing } from "@/lib/marketplaces/types";

/** Lowercase, strip punctuation, and collapse whitespace for brand comparison. */
export function normalizeBrandName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return row[b.length];
}

/** True when two brand strings likely refer to the same label. */
export function similarBrandNames(a: string, b: string): boolean {
  const na = normalizeBrandName(a);
  const nb = normalizeBrandName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  if (shorter.length >= 3 && longer.includes(shorter)) return true;

  const maxLen = Math.max(na.length, nb.length);
  if (maxLen >= 4) {
    const dist = levenshtein(na, nb);
    if (1 - dist / maxLen >= 0.82) return true;
  }

  const queryTokens = na.split(" ").filter((token) => token.length >= 2);
  if (queryTokens.length > 0 && queryTokens.every((token) => nb.includes(token))) {
    return true;
  }

  return false;
}

/** Grailed and others join multiple designers in one string. */
function splitBrandField(brand: string): string[] {
  return brand
    .split(/,\s*|\s+\bx\s+\b|\s+\/\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function titleMentionsBrand(title: string, queryBrand: string): boolean {
  const normalizedTitle = normalizeBrandName(title);
  const normalizedQuery = normalizeBrandName(queryBrand);
  if (!normalizedQuery) return true;
  if (normalizedTitle.includes(normalizedQuery)) return true;
  return similarBrandNames(queryBrand, title);
}

export function listingMatchesQueryBrand(
  listing: SoldListing,
  queryBrand: string,
): boolean {
  const trimmed = queryBrand.trim();
  if (!trimmed) return true;

  const fromField = listing.brand ? splitBrandField(listing.brand) : [];
  if (fromField.length > 0) {
    return fromField.some((brand) => similarBrandNames(trimmed, brand));
  }

  return titleMentionsBrand(listing.title, trimmed);
}

export function filterListingsByQueryBrand(
  listings: readonly SoldListing[],
  queryBrand: string | undefined,
): SoldListing[] {
  const trimmed = queryBrand?.trim();
  if (!trimmed) return [...listings];
  return listings.filter((listing) =>
    listingMatchesQueryBrand(listing, trimmed),
  );
}
