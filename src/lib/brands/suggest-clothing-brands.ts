import { CLOTHING_BRANDS } from "@/lib/brands/clothing-brands";
import { normalizeBrandName } from "@/lib/listings/brand-match";

const DEFAULT_LIMIT = 10;

type Scored = { brand: string; rank: number; index: number };

export function suggestBrandsFromList(
  brands: readonly string[],
  query: string,
  limit = DEFAULT_LIMIT,
): string[] {
  const normalizedQuery = normalizeBrandName(query.trim());
  if (!normalizedQuery || brands.length === 0) return [];

  const scored: Scored[] = [];

  for (let index = 0; index < brands.length; index++) {
    const brand = brands[index]!;
    const normalizedBrand = normalizeBrandName(brand);

    if (normalizedBrand.startsWith(normalizedQuery)) {
      scored.push({ brand, rank: 0, index });
      continue;
    }

    if (normalizedBrand.includes(normalizedQuery)) {
      scored.push({ brand, rank: 1, index });
      continue;
    }

    const tokens = normalizedBrand.split(" ");
    if (tokens.some((token) => token.startsWith(normalizedQuery))) {
      scored.push({ brand, rank: 2, index });
    }
  }

  scored.sort(
    (a, b) => a.rank - b.rank || a.index - b.index || a.brand.localeCompare(b.brand),
  );

  const seen = new Set<string>();
  const results: string[] = [];
  for (const entry of scored) {
    const key = normalizeBrandName(entry.brand);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(entry.brand);
    if (results.length >= limit) break;
  }

  return results;
}

/** Typeahead against the bundled static + eBay-backed catalog on the client. */
export function suggestClothingBrands(
  query: string,
  limit = DEFAULT_LIMIT,
): string[] {
  return suggestBrandsFromList(CLOTHING_BRANDS, query, limit);
}

export function mergeBrandSuggestions(
  groups: readonly (readonly string[])[],
  limit = DEFAULT_LIMIT,
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const group of groups) {
    for (const brand of group) {
      const key = normalizeBrandName(brand);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(brand);
      if (merged.length >= limit) return merged;
    }
  }

  return merged;
}
