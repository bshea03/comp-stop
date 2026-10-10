import { ebayAdapter } from "@/lib/marketplaces/ebay/adapter";
import { poshmarkAdapter } from "@/lib/marketplaces/poshmark/adapter";
import { vintedAdapter } from "@/lib/marketplaces/vinted/adapter";
import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

/**
 * The single place to swap a mock adapter for a live one. Order here is the
 * order marketplaces appear in the UI (Depop uses `depop/run-depop.ts`).
 */
export const MARKETPLACE_ADAPTERS: readonly MarketplaceAdapter[] = [
  ebayAdapter,
  poshmarkAdapter,
  vintedAdapter,
];
