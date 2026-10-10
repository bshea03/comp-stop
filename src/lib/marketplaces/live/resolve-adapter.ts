import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

/**
 * Picks the live adapter unless `USE_MOCK_MARKETPLACES=1` is set in the
 * environment (useful for offline dev and tests).
 */
export function resolveAdapter(
  live: MarketplaceAdapter,
  mock: MarketplaceAdapter,
): MarketplaceAdapter {
  if (process.env.USE_MOCK_MARKETPLACES === "1") {
    return mock;
  }
  return live;
}
