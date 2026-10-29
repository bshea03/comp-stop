import { stripEnv } from "@/lib/env";

type CachedToken = {
  accessToken: string;
  expiresAtMs: number;
};

const tokenCache = new Map<string, CachedToken>();

export function ebayApiOrigin(): string {
  const sandbox = stripEnv(process.env.EBAY_SANDBOX);
  return sandbox === "1" || sandbox?.toLowerCase() === "true"
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";
}

export function ebayMarketplaceId(): string {
  return stripEnv(process.env.EBAY_MARKETPLACE_ID) ?? "EBAY_US";
}

/**
 * Client-credentials token cached per OAuth scope string.
 * Browse and Taxonomy use different scopes and must not share one cache entry.
 */
export async function fetchEbayApplicationToken(
  scope: string,
  signal: AbortSignal,
  credentialsError: string,
): Promise<string> {
  const cached = tokenCache.get(scope);
  if (cached && Date.now() < cached.expiresAtMs - 60_000) {
    return cached.accessToken;
  }

  const clientId = stripEnv(process.env.EBAY_CLIENT_ID);
  const clientSecret = stripEnv(process.env.EBAY_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    throw new Error(credentialsError);
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
      scope,
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`eBay OAuth HTTP ${response.status}: ${raw.slice(0, 200)}`);
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

  const entry: CachedToken = {
    accessToken: json.access_token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  };
  tokenCache.set(scope, entry);
  return entry.accessToken;
}
