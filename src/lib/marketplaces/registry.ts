import { depopAdapter } from "@/lib/marketplaces/depop/adapter";
import { ebayAdapter } from "@/lib/marketplaces/ebay/adapter";
import { poshmarkAdapter } from "@/lib/marketplaces/poshmark/adapter";
import { vintedAdapter } from "@/lib/marketplaces/vinted/adapter";
import type { MarketplaceAdapter, MarketplaceId } from "@/lib/marketplaces/types";

/**
 * The single place to swap a mock adapter for a live one. Order here is the
 * order marketplaces appear in the UI.
 */
export const MARKETPLACE_ADAPTERS: readonly MarketplaceAdapter[] = [
  ebayAdapter,
  poshmarkAdapter,
  vintedAdapter,
  depopAdapter,
];

export function getAdapter(id: MarketplaceId): MarketplaceAdapter | undefined {
  return MARKETPLACE_ADAPTERS.find((adapter) => adapter.id === id);
}
