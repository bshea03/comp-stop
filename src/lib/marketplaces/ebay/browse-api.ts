import { ebayBrowseConditionFilter } from "@/lib/marketplaces/ebay/condition-ids";
import { stripEnv } from "@/lib/env";
import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

const OAUTH_SCOPE = "https://api.ebay.com/oauth/api_scope";

type CachedToken = {
  accessToken: string;
  expiresAtMs: number;
};

let cachedToken: CachedToken | null = null;

function ebayApiOrigin(): string {
  const sandbox = stripEnv(process.env.EBAY_SANDBOX);
  return sandbox === "1" || sandbox?.toLowerCase() === "true"
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";
}

function ebayMarketplaceId(): string {
  return stripEnv(process.env.EBAY_MARKETPLACE_ID) ?? "EBAY_US";
}

function ebayBrowseFetchLimit(query: SearchQuery): number {
  const raw = stripEnv(process.env.EBAY_BROWSE_MAX_LISTINGS);
  const cap = raw ? Number.parseInt(raw, 10) : 60;
  const resolved = Number.isFinite(cap) && cap > 0 ? cap : 60;
  return Math.min(query.limit, resolved, 200);
}

async function fetchEbayApplicationToken(
  signal: AbortSignal,
): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAtMs - 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = stripEnv(process.env.EBAY_CLIENT_ID);
  const clientSecret = stripEnv(process.env.EBAY_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    throw new Error(
      "Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET from the eBay Developer Program (https://developer.ebay.com) for active listing comps.",
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(`${ebayApiOrigin()}/identity/v1/oauth2/token`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: OAUTH_SCOPE,
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(
      `eBay OAuth HTTP ${response.status}: ${raw.slice(0, 200)}`,
    );
  }

  let json: { access_token?: string; expires_in?: number };
  try {
    json = JSON.parse(raw) as { access_token?: string; expires_in?: number };
  } catch {
    throw new Error("eBay OAuth returned invalid JSON.");
  }

  if (!json.access_token) {
    throw new Error("eBay OAuth response did not include an access token.");
  }

  const expiresInSec =
    typeof json.expires_in === "number" && json.expires_in > 0
      ? json.expires_in
      : 7200;
  cachedToken = {
    accessToken: json.access_token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  };

  return cachedToken.accessToken;
}

type BrowseItemSummary = {
  itemId?: string;
  title?: string;
  price?: { value?: string; currency?: string };
  condition?: string;
  conditionId?: string;
  itemWebUrl?: string;
  brand?: string;
  thumbnailImages?: Array<{ imageUrl?: string }>;
  image?: { imageUrl?: string };
};

type BrowseSearchResponse = {
  itemSummaries?: BrowseItemSummary[];
  total?: number;
};

function mapBrowseItem(item: BrowseItemSummary): SoldListing | null {
  if (!item.itemId || !item.title || !item.itemWebUrl) return null;

  const value = item.price?.value;
  if (value == null) return null;
  const dollars = Number.parseFloat(value);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;

  const currency = (item.price?.currency ?? "USD").toUpperCase();
  if (currency.length !== 3) return null;

  const imageUrl =
    item.thumbnailImages?.[0]?.imageUrl ?? item.image?.imageUrl;

  return {
    id: item.itemId,
    marketplace: "ebay",
    title: item.title,
    brand: item.brand?.trim() || undefined,
    condition: item.condition?.trim() || undefined,
    priceCents: Math.round(dollars * 100),
    currency,
    soldAt: new Date().toISOString(),
    url: item.itemWebUrl,
    imageUrl,
  };
}

function browseFilters(query: SearchQuery): string[] {
  const filters: string[] = [];
  const conditionFilter = ebayBrowseConditionFilter(query.condition);
  if (conditionFilter) filters.push(conditionFilter);
  return filters;
}

/** Active listings via eBay Buy Browse API (`item_summary/search`). */
export async function searchEbayBrowseActive(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  const token = await fetchEbayApplicationToken(signal);
  const limit = ebayBrowseFetchLimit(query);
  const q = keywordString(query) || query.keywords.trim();

  const params = new URLSearchParams({
    q,
    limit: String(limit),
  });

  const filters = browseFilters(query);
  if (filters.length > 0) {
    params.set("filter", filters.join(","));
  }

  const response = await fetch(
    `${ebayApiOrigin()}/buy/browse/v1/item_summary/search?${params.toString()}`,
    {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-EBAY-C-MARKETPLACE-ID": ebayMarketplaceId(),
      },
    },
  );

  const raw = await response.text();
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `eBay Browse API HTTP ${response.status}. Check EBAY_CLIENT_ID / EBAY_CLIENT_SECRET and that Buy APIs are enabled for the app.`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `eBay Browse API HTTP ${response.status}: ${raw.slice(0, 200)}`,
    );
  }

  let body: BrowseSearchResponse;
  try {
    body = JSON.parse(raw) as BrowseSearchResponse;
  } catch {
    throw new Error("eBay Browse API returned invalid JSON.");
  }

  return (body.itemSummaries ?? [])
    .map(mapBrowseItem)
    .filter((listing): listing is SoldListing => listing !== null)
    .slice(0, limit);
}
