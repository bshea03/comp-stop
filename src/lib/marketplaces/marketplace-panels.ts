import type { ListingKind, MarketplaceId, PanelSearchId } from "@/lib/marketplaces/types";

export type MarketplacePanel = {
  searchId: PanelSearchId;
  id: MarketplaceId;
  label: string;
  listingKind: ListingKind;
  /** Link-out card only (no in-app listing grid). */
  linkOut?: boolean;
};

export const ALL_MARKETPLACE_PANELS: readonly MarketplacePanel[] = [
  { searchId: "ebay", id: "ebay", label: "eBay", listingKind: "sold" },
  { searchId: "poshmark", id: "poshmark", label: "Poshmark", listingKind: "sold" },
  { searchId: "grailed", id: "grailed", label: "Grailed", listingKind: "sold" },
  { searchId: "vinted", id: "vinted", label: "Vinted", listingKind: "active" },
  {
    searchId: "ebay-active",
    id: "ebay",
    label: "eBay",
    listingKind: "active",
  },
  {
    searchId: "poshmark-active",
    id: "poshmark",
    label: "Poshmark",
    listingKind: "active",
  },
  {
    searchId: "mercari",
    id: "mercari",
    label: "Mercari",
    listingKind: "sold",
    linkOut: true,
  },
  {
    searchId: "depop",
    id: "depop",
    label: "Depop",
    listingKind: "active",
    linkOut: true,
  },
];

export const PANEL_SEARCH_IDS: readonly PanelSearchId[] =
  ALL_MARKETPLACE_PANELS.map((panel) => panel.searchId);

export function marketplacePanelsForKind(
  kind: ListingKind,
): readonly MarketplacePanel[] {
  return ALL_MARKETPLACE_PANELS.filter((panel) => panel.listingKind === kind);
}

/** In-app listing grids (registry adapters). */
export const DATA_MARKETPLACE_PANELS: readonly MarketplacePanel[] =
  ALL_MARKETPLACE_PANELS.filter((panel) => !panel.linkOut);

/** @deprecated Prefer grouping by `listingKind` in the UI. */
export const LINK_OUT_MARKETPLACE_PANELS: readonly MarketplacePanel[] =
  ALL_MARKETPLACE_PANELS.filter((panel) => panel.linkOut);
