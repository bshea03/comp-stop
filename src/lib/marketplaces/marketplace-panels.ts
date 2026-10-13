import {
  MARKETPLACE_IDS,
  type ListingKind,
  type MarketplaceId,
  type PanelSearchId,
} from "@/lib/marketplaces/types";

export type MarketplacePanel = {
  searchId: PanelSearchId;
  id: MarketplaceId;
  label: string;
  listingKind: ListingKind;
  /** Link-out-only shops render under “Search on site” in that tab. */
  linkOut?: boolean;
};

type PanelSlot = {
  searchId: PanelSearchId;
  /** Historically separated link-out cards; cards still resolve via `searchMarketplace`. */
  linkOut?: boolean;
};

type MarketplaceCatalogEntry = {
  id: MarketplaceId;
  label: string;
  sold?: PanelSlot;
  active?: PanelSlot;
};

/**
 * Canonical shop order (shared by sold and active tabs). Each tab lists every
 * marketplace that exposes that kind of data in-app or via link-out.
 */
export const MARKETPLACE_CATALOG: readonly MarketplaceCatalogEntry[] = [
  {
    id: "ebay",
    label: "eBay",
    sold: { searchId: "ebay" },
    active: { searchId: "ebay-active" },
  },
  {
    id: "poshmark",
    label: "Poshmark",
    sold: { searchId: "poshmark" },
    active: { searchId: "poshmark-active" },
  },
  {
    id: "mercari",
    label: "Mercari",
    sold: { searchId: "mercari", linkOut: true },
  },
  {
    id: "grailed",
    label: "Grailed",
    sold: { searchId: "grailed" },
  },
  {
    id: "vinted",
    label: "Vinted",
    active: { searchId: "vinted" },
  },
  {
    id: "depop",
    label: "Depop",
    active: { searchId: "depop", linkOut: true },
  },
];

/** Same sequence as {@link MARKETPLACE_CATALOG}. */
export const MARKETPLACE_DISPLAY_ORDER: readonly MarketplaceId[] =
  MARKETPLACE_IDS;

function panelFromSlot(
  entry: MarketplaceCatalogEntry,
  kind: ListingKind,
  slot: PanelSlot,
): MarketplacePanel {
  return {
    searchId: slot.searchId,
    id: entry.id,
    label: entry.label,
    listingKind: kind,
    linkOut: slot.linkOut,
  };
}

export function marketplacePanelsForKind(
  kind: ListingKind,
): readonly MarketplacePanel[] {
  return MARKETPLACE_CATALOG.flatMap((entry) => {
    const slot = kind === "sold" ? entry.sold : entry.active;
    if (!slot) return [];
    return [panelFromSlot(entry, kind, slot)];
  });
}

/** Every panel row (sold + active adapters) in catalog order. */
export const ALL_MARKETPLACE_PANELS: readonly MarketplacePanel[] =
  MARKETPLACE_CATALOG.flatMap((entry) => {
    const panels: MarketplacePanel[] = [];
    if (entry.sold) panels.push(panelFromSlot(entry, "sold", entry.sold));
    if (entry.active) panels.push(panelFromSlot(entry, "active", entry.active));
    return panels;
  });

export const PANEL_SEARCH_IDS: readonly PanelSearchId[] =
  ALL_MARKETPLACE_PANELS.map((panel) => panel.searchId);

/** In-app listing grids (excludes legacy link-out flag only). */
export const DATA_MARKETPLACE_PANELS: readonly MarketplacePanel[] =
  ALL_MARKETPLACE_PANELS.filter((panel) => !panel.linkOut);

/** @deprecated Link-out cards sit in the main grid; kept for README / tooling. */
export const LINK_OUT_MARKETPLACE_PANELS: readonly MarketplacePanel[] =
  ALL_MARKETPLACE_PANELS.filter((panel) => panel.linkOut);
