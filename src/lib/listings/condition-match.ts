import { CONDITION_USED_ONLY, CONDITIONS } from "@/lib/schema";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

export type CanonicalCondition = (typeof CONDITIONS)[number];

export const USED_CANONICAL_CONDITIONS = [
  "Excellent",
  "Good",
  "Fair",
] as const satisfies readonly CanonicalCondition[];

export function conditionFilterLabel(condition: string): string {
  if (condition === CONDITION_USED_ONLY) return "Used only";
  return condition;
}

const CANONICAL_CONDITION_DISPLAY: Record<CanonicalCondition, string> = {
  "New with tags": "New - With Tags",
  "New without tags": "New - Without Tags",
  Excellent: "Used - Like New",
  Good: "Used - Good",
  Fair: "Used - Fair",
};

/** User-facing condition on comp rows (maps marketplace labels to a consistent format). */
export function formatListingCondition(
  raw: string | undefined,
): string | undefined {
  if (!raw?.trim()) return undefined;
  const canonical = canonicalCondition(raw);
  if (canonical) return CANONICAL_CONDITION_DISPLAY[canonical];
  return raw.trim();
}

function normalizeConditionText(value: string): string {
  return value
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^\p{L}\p{N}\s/+]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map marketplace-specific condition labels to our dropdown values. */
export function canonicalCondition(
  raw: string | undefined,
): CanonicalCondition | null {
  if (!raw?.trim()) return null;

  const normalized = normalizeConditionText(raw);

  for (const option of CONDITIONS) {
    if (normalized === normalizeConditionText(option)) return option;
  }

  const rules: Array<{ match: RegExp | string; value: CanonicalCondition }> = [
    { match: /^nwt$/, value: "New with tags" },
    { match: /^nwot$/, value: "New without tags" },
    { match: /new\s*\/\s*never\s*worn|never worn/, value: "New without tags" },
    { match: /new with tags?/, value: "New with tags" },
    { match: /new without tags?/, value: "New without tags" },
    { match: /brand new/, value: "New without tags" },
    { match: /used like new|like new/, value: "Excellent" },
    { match: /gently used|very good|excellent|mint|pristine/, value: "Excellent" },
    { match: /^good$|good condition|\bgood\b/, value: "Good" },
    { match: /fair|satisfactory|well worn|very worn/, value: "Fair" },
    { match: /\bworn\b/, value: "Fair" },
  ];

  for (const rule of rules) {
    const hit =
      typeof rule.match === "string"
        ? normalized.includes(rule.match)
        : rule.match.test(normalized);
    if (hit) return rule.value;
  }

  if (normalized.includes("pre owned") || normalized.includes("preowned")) {
    return "Good";
  }

  return null;
}

export function listingMatchesQueryCondition(
  listing: SoldListing,
  queryCondition: NonNullable<SearchQuery["condition"]>,
): boolean {
  const listingCondition = canonicalCondition(listing.condition);
  if (!listingCondition) return false;

  if (queryCondition === CONDITION_USED_ONLY) {
    return (USED_CANONICAL_CONDITIONS as readonly string[]).includes(
      listingCondition,
    );
  }

  return listingCondition === queryCondition;
}

function isCanonicalCondition(
  value: string,
): value is CanonicalCondition {
  return (CONDITIONS as readonly string[]).includes(value);
}

export function filterListingsByQueryCondition(
  listings: readonly SoldListing[],
  queryCondition: SearchQuery["condition"],
): SoldListing[] {
  if (!queryCondition) {
    return [...listings];
  }
  if (
    queryCondition !== CONDITION_USED_ONLY &&
    !isCanonicalCondition(queryCondition)
  ) {
    return [...listings];
  }
  return listings.filter((listing) =>
    listingMatchesQueryCondition(listing, queryCondition),
  );
}
