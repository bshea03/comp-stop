import { ebayActiveAdapter } from "@/lib/marketplaces/ebay/active-adapter";
import { ebayAdapter } from "@/lib/marketplaces/ebay/adapter";
import { grailedAdapter } from "@/lib/marketplaces/grailed/adapter";
import { poshmarkActiveAdapter } from "@/lib/marketplaces/poshmark/active-adapter";
import { poshmarkAdapter } from "@/lib/marketplaces/poshmark/adapter";
import { vintedAdapter } from "@/lib/marketplaces/vinted/adapter";
import type { MarketplaceAdapter } from "@/lib/marketplaces/types";

/**
 * Live/mock adapters for in-app comps. UI order comes from `MARKETPLACE_CATALOG`
 * in `marketplace-panels.ts` (Depop/Mercari use `run-depop` / `run-mercari`).
 */
export const MARKETPLACE_ADAPTERS: readonly MarketplaceAdapter[] = [
  ebayAdapter,
  poshmarkAdapter,
  grailedAdapter,
  vintedAdapter,
];

/** Second panels (same brand, different listing kind). */
export const EXTRA_MARKETPLACE_ADAPTERS: readonly MarketplaceAdapter[] = [
  ebayActiveAdapter,
  poshmarkActiveAdapter,
];
