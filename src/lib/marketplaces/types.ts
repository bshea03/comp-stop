export const MARKETPLACE_IDS = [
  "ebay",
  "poshmark",
  "mercari",
  "grailed",
  "vinted",
  "depop",
] as const;

export type MarketplaceId = (typeof MARKETPLACE_IDS)[number];

/** Unique key for search/cache when one marketplace has sold + active panels. */
export type PanelSearchId = MarketplaceId | "ebay-active" | "poshmark-active";

/** Whether a result came from the marketplace itself or from the mock generator. */
export type DataSource = "live" | "mock";

export type SearchQuery = {
  keywords: string;
  brand?: string;
  condition?: string;
  daysBack: number;
  limit: number;
};

/**
 * Prices are integer cents so that sums and averages never accumulate float
 * drift. Convert to a display string with `formatCents`.
 */
export type SoldListing = {
  id: string;
  marketplace: MarketplaceId;
  title: string;
  brand?: string;
  size?: string;
  condition?: string;
  priceCents: number;
  currency: string;
  /** ISO 8601 date string. */
  soldAt: string;
  url: string;
  imageUrl?: string;
};

export type PriceStats = {
  count: number;
  currency: string;
  meanCents: number;
  /** Mean after dropping the top and bottom 10% of comps. */
  trimmedMeanCents: number;
  medianCents: number;
  minCents: number;
  maxCents: number;
  /** ISO 8601 date string of the oldest comp. */
  oldestSoldAt: string;
  /** ISO 8601 date string of the newest comp. */
  newestSoldAt: string;
};

export type ListingKind = "sold" | "active";

export type MarketplaceResultStatus = "ok" | "empty" | "error" | "external";

export type MarketplaceResult = {
  marketplace: MarketplaceId;
  label: string;
  status: MarketplaceResultStatus;
  dataSource: DataSource;
  /** Whether prices are from sold comps or from active listings. */
  listingKind: ListingKind;
  /** Shown on the card when live data is not sold comps (e.g. Vinted active listings). */
  resultCaveat?: string;
  /** Primary copy when `status` is `external` (e.g. Depop link-out). */
  externalMessage?: string;
  /** Development-only hint on external cards (not shown in production builds). */
  devNote?: string;
  /** The same search run on the marketplace itself, for verifying comps. */
  searchUrl: string;
  listings: SoldListing[];
  stats: PriceStats | null;
  error?: string;
};

export interface MarketplaceAdapter {
  id: MarketplaceId;
  /** Defaults to `id`. Use `ebay-active` / `poshmark-active` for second panels. */
  searchId?: PanelSearchId;
  label: string;
  dataSource: DataSource;
  listingKind: ListingKind;
  resultCaveat?: string;
  /** Link to the marketplace's own search results for the same query. */
  buildSearchUrl(query: SearchQuery): string;
  search(query: SearchQuery, signal: AbortSignal): Promise<SoldListing[]>;
}
