import {
  ALL_MARKETPLACE_PANELS,
  MARKETPLACE_CATALOG,
} from "@/lib/marketplaces/marketplace-panels";
import type { ListingKind } from "@/lib/marketplaces/types";
import {
  MARKETPLACE_IDS,
  type MarketplaceId,
  type PanelSearchId,
} from "@/lib/marketplaces/types";

export const MARKETPLACE_VISIBILITY_STORAGE_KEY =
  "compstop.marketplace-visibility.v1";

/** Synced from localStorage so the server can skip hidden marketplace fetches. */
export const MARKETPLACE_VISIBILITY_COOKIE_NAME = "compstop.mv";

export type MarketplaceVisibility = Record<MarketplaceId, boolean>;

export function defaultMarketplaceVisibility(): MarketplaceVisibility {
  return Object.fromEntries(
    MARKETPLACE_IDS.map((id) => [id, true]),
  ) as MarketplaceVisibility;
}

export function parseMarketplaceVisibility(
  raw: string | null,
): MarketplaceVisibility {
  const base = defaultMarketplaceVisibility();
  if (!raw) return base;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return base;

    for (const id of MARKETPLACE_IDS) {
      const value = (parsed as Record<string, unknown>)[id];
      if (typeof value === "boolean") base[id] = value;
    }
    return base;
  } catch {
    return base;
  }
}

export function serializeMarketplaceVisibility(
  visibility: MarketplaceVisibility,
): string {
  return JSON.stringify(visibility);
}

export function parseMarketplaceVisibilityCookie(
  raw: string | undefined,
): MarketplaceVisibility {
  if (!raw) return defaultMarketplaceVisibility();
  try {
    return parseMarketplaceVisibility(decodeURIComponent(raw));
  } catch {
    return parseMarketplaceVisibility(raw);
  }
}

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

/** Client-only: mirror visibility to a cookie for the next server render. */
export function writeMarketplaceVisibilityCookie(
  visibility: MarketplaceVisibility,
): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(serializeMarketplaceVisibility(visibility));
  document.cookie = `${MARKETPLACE_VISIBILITY_COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function isMarketplaceEnabled(
  visibility: MarketplaceVisibility,
  id: MarketplaceId,
): boolean {
  return visibility[id] !== false;
}

export function enabledPanelSearchIds(
  visibility: MarketplaceVisibility,
): PanelSearchId[] {
  return ALL_MARKETPLACE_PANELS.filter((panel) =>
    isMarketplaceEnabled(visibility, panel.id),
  ).map((panel) => panel.searchId);
}

export function enabledPanelSearchIdsForKind(
  visibility: MarketplaceVisibility,
  listingKind: ListingKind,
): PanelSearchId[] {
  return ALL_MARKETPLACE_PANELS.filter(
    (panel) =>
      panel.listingKind === listingKind &&
      isMarketplaceEnabled(visibility, panel.id),
  ).map((panel) => panel.searchId);
}

export type MarketplaceCatalogRow = {
  id: MarketplaceId;
  label: string;
  sold: boolean;
  active: boolean;
  linkOut: boolean;
};

/** One row per shop for the visibility menu (catalog order). */
export function marketplaceCatalogRows(): readonly MarketplaceCatalogRow[] {
  return MARKETPLACE_CATALOG.map((entry) => ({
    id: entry.id,
    label: entry.label,
    sold: Boolean(entry.sold),
    active: Boolean(entry.active),
    linkOut: Boolean(entry.sold?.linkOut || entry.active?.linkOut),
  }));
}

export function countEnabledMarketplaces(
  visibility: MarketplaceVisibility,
): number {
  return MARKETPLACE_IDS.filter((id) => isMarketplaceEnabled(visibility, id))
    .length;
}
