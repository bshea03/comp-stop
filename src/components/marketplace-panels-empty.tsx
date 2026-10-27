"use client";

import type { ReactNode } from "react";

import { useMarketplaceVisibility } from "@/components/marketplace-visibility";
import type { MarketplaceId } from "@/lib/marketplaces/types";
import { marketplacePanelsForKind } from "@/lib/marketplaces/marketplace-panels";
import type { ListingKind } from "@/lib/marketplaces/types";

export function MarketplacePanelsEmptyHint({
  listingKind,
}: {
  listingKind: ListingKind;
}) {
  const { hydrated, isEnabled } = useMarketplaceVisibility();
  if (!hydrated) return null;

  const panels = marketplacePanelsForKind(listingKind);
  const anyVisible = panels.some((panel) => isEnabled(panel.id));
  if (anyVisible) return null;

  return (
    <p className="rounded-xl border border-dashed border-border-subtle bg-surface-muted/40 px-4 py-6 text-center text-sm text-muted">
      All shops are hidden for this tab. Open{" "}
      <span className="font-medium text-foreground">Marketplaces</span> in the
      search box to turn some back on.
    </p>
  );
}

export function VisibleLinkOutSection({
  panels,
  children,
}: {
  panels: readonly { id: MarketplaceId }[];
  children: ReactNode;
}) {
  const { hydrated, isEnabled } = useMarketplaceVisibility();

  const visible = hydrated
    ? panels.some((panel) => isEnabled(panel.id))
    : true;

  if (!visible) return null;
  return children;
}
