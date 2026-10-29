import { z } from "zod";

import { MARKETPLACE_IDS, type SearchQuery } from "@/lib/marketplaces/types";

export const CONDITIONS = [
  "New with tags",
  "New without tags",
  "Excellent",
  "Good",
  "Fair",
] as const;

/** URL / form value: pre-owned comps only (Excellent, Good, Fair). */
export const CONDITION_USED_ONLY = "used" as const;

export const CONDITION_QUERY_VALUES = [
  CONDITION_USED_ONLY,
  ...CONDITIONS,
] as const;

export const TIME_WINDOWS = [
  { days: 30, label: "Last 30 days" },
  { days: 60, label: "Last 60 days" },
  { days: 90, label: "Last 90 days" },
  { days: 180, label: "Last 6 months" },
  { days: 365, label: "Last year" },
] as const;

export const DEFAULT_DAYS_BACK = 90;
export const DEFAULT_LIMIT = 60;

export const SEARCH_PARAM_KEYS = {
  keywords: "q",
  brand: "brand",
  size: "size",
  condition: "condition",
  daysBack: "days",
} as const;

const trimmedText = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value.length > 0 ? value : undefined));

export const searchQuerySchema = z.object({
  keywords: z.string().trim().min(1, "Enter a garment, brand, or tag").max(120),
  brand: trimmedText.optional(),
  size: trimmedText.optional(),
  condition: z.enum(CONDITION_QUERY_VALUES).optional(),
  daysBack: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .catch(DEFAULT_DAYS_BACK)
    .default(DEFAULT_DAYS_BACK),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .catch(DEFAULT_LIMIT)
    .default(DEFAULT_LIMIT),
});

export type SearchQueryFields = z.infer<typeof searchQuerySchema>;
export type ConditionQuery = SearchQueryFields["condition"];

export const soldListingSchema = z.object({
  id: z.string().min(1),
  marketplace: z.enum(MARKETPLACE_IDS),
  title: z.string().min(1),
  brand: z.string().optional(),
  size: z.string().optional(),
  condition: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  soldAt: z.iso.datetime(),
  url: z.url(),
  imageUrl: z
    .union([z.url(), z.string().startsWith("data:image/")])
    .optional(),
});

export type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const searchFieldsSchema = searchQuerySchema.pick({
  keywords: true,
  brand: true,
  size: true,
  condition: true,
  daysBack: true,
});

/** Reads URL / form fields into a partial query (invalid optionals are omitted). */
export function readSearchQueryFields(input: {
  keywords?: string | null;
  brand?: string | null;
  size?: string | null;
  condition?: string | null;
  daysBack?: string | number | null;
}): Partial<SearchQuery> {
  const parsed = searchFieldsSchema.safeParse({
    keywords: input.keywords?.trim() ?? "",
    brand: input.brand ?? undefined,
    size: input.size ?? undefined,
    condition: input.condition ?? undefined,
    daysBack: input.daysBack ?? undefined,
  });

  if (!parsed.success || !parsed.data.keywords) {
    return {};
  }

  return parsed.data;
}

export function readSearchQueryFromSearchParams(
  params: URLSearchParams,
): Partial<SearchQuery> {
  return readSearchQueryFields({
    keywords: params.get(SEARCH_PARAM_KEYS.keywords),
    brand: params.get(SEARCH_PARAM_KEYS.brand),
    size: params.get(SEARCH_PARAM_KEYS.size),
    condition: params.get(SEARCH_PARAM_KEYS.condition),
    daysBack: params.get(SEARCH_PARAM_KEYS.daysBack),
  });
}

export function readSearchQueryFromFormData(data: FormData): Partial<SearchQuery> {
  const read = (key: string) =>
    (data.get(key) as string | null)?.trim() || undefined;

  return readSearchQueryFields({
    keywords: read(SEARCH_PARAM_KEYS.keywords),
    brand: read(SEARCH_PARAM_KEYS.brand),
    size: read(SEARCH_PARAM_KEYS.size),
    condition: read(SEARCH_PARAM_KEYS.condition),
    daysBack: (data.get(SEARCH_PARAM_KEYS.daysBack) as string | null) ?? undefined,
  });
}

/** Canonical querystring key for deduping searches (excludes `limit` and `view`). */
export function searchQueryCacheKey(query: Partial<SearchQuery>): string | null {
  if (!query.keywords?.trim()) return null;
  return buildSearchParams(query);
}

/**
 * Turns URL search params into a validated `SearchQuery`, or `null` when the
 * user has not searched for anything yet. Malformed optional params fall back
 * to their defaults rather than failing the whole page.
 */
export function parseSearchParams(params: RawSearchParams): SearchQuery | null {
  const keywords = firstValue(params[SEARCH_PARAM_KEYS.keywords])?.trim();
  if (!keywords) return null;

  const result = searchQuerySchema.safeParse({
    keywords,
    brand: firstValue(params[SEARCH_PARAM_KEYS.brand]),
    size: firstValue(params[SEARCH_PARAM_KEYS.size]),
    condition: firstValue(params[SEARCH_PARAM_KEYS.condition]),
    daysBack: firstValue(params[SEARCH_PARAM_KEYS.daysBack]),
    limit: undefined,
  });

  return result.success ? result.data : null;
}

/** Builds the canonical querystring for a search, used by the search form. */
export function buildSearchParams(query: Partial<SearchQuery>): string {
  const params = new URLSearchParams();
  if (query.keywords) params.set(SEARCH_PARAM_KEYS.keywords, query.keywords);
  if (query.brand) params.set(SEARCH_PARAM_KEYS.brand, query.brand);
  if (query.size) params.set(SEARCH_PARAM_KEYS.size, query.size);
  if (query.condition) params.set(SEARCH_PARAM_KEYS.condition, query.condition);
  if (query.daysBack && query.daysBack !== DEFAULT_DAYS_BACK) {
    params.set(SEARCH_PARAM_KEYS.daysBack, String(query.daysBack));
  }
  return params.toString();
}
