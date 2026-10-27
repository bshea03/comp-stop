import { ComparisonBarSkeleton } from "@/components/comparison-bar";
import {
  MarketplaceCardSkeleton,
} from "@/components/marketplace-card";
import { MarketplacePanelGate } from "@/components/marketplace-visibility";
import { VisibleLinkOutSection } from "@/components/marketplace-panels-empty";
import type { ListingKind } from "@/lib/marketplaces/types";
import { marketplacePanelsForKind } from "@/lib/marketplaces/marketplace-panels";

function sectionHeadingId(listingKind: ListingKind): string {
  return listingKind === "sold" ? "results-sold-heading" : "results-active-heading";
}

function SectionHeaderSkeleton({ listingKind }: { listingKind: ListingKind }) {
  const isSold = listingKind === "sold";
  const title = listingKind === "sold" ? "Sold comps" : "Active listings";
  const eyebrow = listingKind === "sold" ? "Sold marketplaces" : "Active marketplaces";

  return (
    <header
      className={[
        "border-b pb-4 pt-1",
        isSold ? "border-accent/25" : "border-border-subtle",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={`size-2 shrink-0 rounded-full ${isSold ? "bg-accent" : "bg-vinted"}`}
          aria-hidden
        />
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isSold ? "text-accent" : "text-vinted"}`}
        >
          {eyebrow}
        </p>
        <span className="hidden text-muted/50 sm:inline" aria-hidden>
          ·
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
      </div>
      <div className="mt-2 h-4 w-full max-w-lg animate-pulse rounded bg-surface-muted" />
    </header>
  );
}

export function MarketplaceResultsSectionSkeleton({
  listingKind,
  loading = true,
  className,
}: {
  listingKind: ListingKind;
  loading?: boolean;
  className?: string;
}) {
  const panels = marketplacePanelsForKind(listingKind);
  if (panels.length === 0) return null;

  const dataPanels = panels.filter((panel) => !panel.linkOut);
  const linkOutPanels = panels.filter((panel) => panel.linkOut);

  return (
    <section
      aria-labelledby={sectionHeadingId(listingKind)}
      className={className ?? "space-y-6"}
    >
      <SectionHeaderSkeleton listingKind={listingKind} />
      <ComparisonBarSkeleton loading={loading} />
      {dataPanels.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {dataPanels.map(({ searchId, id, label }) => (
            <MarketplacePanelGate key={searchId} marketplaceId={id}>
              <MarketplaceCardSkeleton
                marketplace={id}
                label={label}
                loading={loading}
              />
            </MarketplacePanelGate>
          ))}
        </div>
      ) : null}
      {linkOutPanels.length > 0 ? (
        <VisibleLinkOutSection panels={linkOutPanels}>
          <div className="space-y-3 border-t border-border-subtle pt-6">
            <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
            <div className="grid gap-5 md:grid-cols-2">
              {linkOutPanels.map(({ searchId, id, label }) => (
                <MarketplacePanelGate key={searchId} marketplaceId={id}>
                  <MarketplaceCardSkeleton
                    marketplace={id}
                    label={label}
                    loading={loading}
                  />
                </MarketplacePanelGate>
              ))}
            </div>
          </div>
        </VisibleLinkOutSection>
      ) : null}
    </section>
  );
}
