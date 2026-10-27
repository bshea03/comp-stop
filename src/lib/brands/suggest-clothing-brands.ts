import { CLOTHING_BRANDS } from "@/lib/brands/clothing-brands";
import { normalizeBrandName } from "@/lib/listings/brand-match";

const DEFAULT_LIMIT = 10;

type Scored = { brand: string; rank: number; index: number };

/**
 * Typeahead matches against the unified resale brand list (prefix, then substring,
 * then token-prefix). Results are unique display names.
 */
export function suggestClothingBrands(
  query: string,
  limit = DEFAULT_LIMIT,
): string[] {
  const normalizedQuery = normalizeBrandName(query.trim());
  if (!normalizedQuery) return [];

  const scored: Scored[] = [];

  for (let index = 0; index < CLOTHING_BRANDS.length; index++) {
    const brand = CLOTHING_BRANDS[index]!;
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
