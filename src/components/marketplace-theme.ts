import type { MarketplaceId } from "@/lib/marketplaces/types";

/**
 * Brand accents, so a marketplace is identifiable by color in both the cards
 * and the comparison chart.
 */
export const MARKETPLACE_THEME: Record<
  MarketplaceId,
  { dot: string; bar: string; text: string }
> = {
  ebay: { dot: "bg-ebay", bar: "bg-ebay", text: "text-ebay" },
  poshmark: { dot: "bg-poshmark", bar: "bg-poshmark", text: "text-poshmark" },
  vinted: { dot: "bg-vinted", bar: "bg-vinted", text: "text-vinted" },
  depop: { dot: "bg-depop", bar: "bg-depop", text: "text-depop" },
};
