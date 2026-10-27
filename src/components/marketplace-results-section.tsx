import { Suspense } from "react";

import { ComparisonBarSkeleton } from "@/components/comparison-bar";
import { ComparisonBarForKindFiltered } from "@/components/comparison-bar-client";
import { MarketplacePanelGate } from "@/components/marketplace-visibility";
import {
  MarketplacePanelsEmptyHint,
  VisibleLinkOutSection,
} from "@/components/marketplace-panels-empty";
import {
  MarketplaceCard,
  MarketplaceCardSkeleton,
} from "@/components/marketplace-card";
import { MarketplaceLoadTracker } from "@/components/search-state";
import type {
  ListingKind,
  MarketplaceId,
  PanelSearchId,
  SearchQuery,
} from "@/lib/marketplaces/types";
import { isMarketplaceEnabled } from "@/lib/marketplace-visibility";
import { getMarketplaceVisibilityFromRequest } from "@/lib/marketplace-visibility-server";
import { enabledPanelSearchIdsForKind } from "@/lib/marketplace-visibility";
import { marketplacePanelsForKind } from "@/lib/marketplaces/marketplace-panels";
import { searchAllMarketplaces, searchMarketplace } from "@/lib/search-service";

function sectionHeadingId(listingKind: ListingKind): string {
  return listingKind === "sold" ? "results-sold-heading" : "results-active-heading";
}

function sectionCopy(listingKind: ListingKind): {
  title: string;
  eyebrow: string;
  description: string;
} {
  if (listingKind === "sold") {
    return {
      eyebrow: "Sold marketplaces",
      title: "Sold comps",
      description:
        "Completed sales from marketplaces that expose sold data in-app.",
    };
  }
  return {
    eyebrow: "Active marketplaces",
    title: "Active listings",
    description:
      "Current asking prices from listings still for sale—not confirmed sold comps.",
  };
}

function SectionHeaderFrame({
  listingKind,
  children,
}: {
  listingKind: ListingKind;
  children: React.ReactNode;
}) {
  const isSold = listingKind === "sold";

  return (
    <header
      className={[
        "border-b pb-4 pt-1",
        isSold ? "border-accent/25" : "border-border-subtle",
      ].join(" ")}
    >
      {children}
    </header>
  );
}

function SectionHeader({
  listingKind,
  description,
}: {
  listingKind: ListingKind;
  description: string;
}) {
  const isSold = listingKind === "sold";
  const { title, eyebrow } = sectionCopy(listingKind);

  return (
    <SectionHeaderFrame listingKind={listingKind}>
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
        <h2
          id={sectionHeadingId(listingKind)}
          className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {title}
        </h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        {description}
      </p>
    </SectionHeaderFrame>
  );
}

async function MarketplaceResultCard({
  searchId,
  query,
}: {
  searchId: PanelSearchId;
  query: SearchQuery;
}) {
  return (
    <MarketplaceCard result={await searchMarketplace(searchId, query)} />
  );
}

function PanelGrid({
  panels,
  query,
  searchKey,
}: {
  panels: readonly {
    searchId: PanelSearchId;
    id: MarketplaceId;
    label: string;
  }[];
  query: SearchQuery;
  searchKey: string;
}) {
  if (panels.length === 0) return null;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {panels.map(({ searchId, id, label }) => (
        <MarketplacePanelGate
          key={`${searchId}-${searchKey}`}
          marketplaceId={id}
        >
          <Suspense
            fallback={
              <MarketplaceCardSkeleton marketplace={id} label={label} loading />
            }
          >
            <MarketplaceLoadTracker searchId={searchId}>
              <MarketplaceResultCard searchId={searchId} query={query} />
            </MarketplaceLoadTracker>
          </Suspense>
        </MarketplacePanelGate>
      ))}
    </div>
  );
}

function LinkOutPanelsSection({
  panels,
  listingKind,
  query,
  searchKey,
}: {
  panels: readonly {
    searchId: PanelSearchId;
    id: MarketplaceId;
    label: string;
  }[];
  listingKind: ListingKind;
  query: SearchQuery;
  searchKey: string;
}) {
  if (panels.length === 0) return null;

  const kindLabel = listingKind === "sold" ? "sold comps" : "active listings";

  return (
    <VisibleLinkOutSection panels={panels}>
      <div className="space-y-3 border-t border-border-subtle pt-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Search on site
          </p>
          <p className="mt-1 text-sm text-muted">
            Open these marketplaces with the same query when in-app {kindLabel}{" "}
            aren&apos;t available here.
          </p>
        </div>
        <PanelGrid panels={panels} query={query} searchKey={searchKey} />
      </div>
    </VisibleLinkOutSection>
  );
}

function splitPanelsByLinkOut(
  panels: ReturnType<typeof marketplacePanelsForKind>,
) {
  return {
    dataPanels: panels.filter((panel) => !panel.linkOut),
    linkOutPanels: panels.filter((panel) => panel.linkOut),
  };
}

async function SectionComparison({
  query,
  listingKind,
}: {
  query: SearchQuery;
  listingKind: ListingKind;
}) {
  const visibility = await getMarketplaceVisibilityFromRequest();
  const searchIds = enabledPanelSearchIdsForKind(visibility, listingKind);
  const results = await searchAllMarketplaces(query, searchIds);
  return (
    <ComparisonBarForKindFiltered results={results} listingKind={listingKind} />
  );
}

export async function MarketplaceResultsSection({
  listingKind,
  query,
  searchKey,
  className,
}: {
  listingKind: ListingKind;
  query: SearchQuery;
  searchKey: string;
  className?: string;
}) {
  const visibility = await getMarketplaceVisibilityFromRequest();
  const allPanels = marketplacePanelsForKind(listingKind);
  if (allPanels.length === 0) return null;

  const panels = allPanels.filter((panel) =>
    isMarketplaceEnabled(visibility, panel.id),
  );
  const { dataPanels, linkOutPanels } = splitPanelsByLinkOut(panels);
  const { description } = sectionCopy(listingKind);

  return (
    <section
      aria-labelledby={sectionHeadingId(listingKind)}
      className={className ?? "space-y-6"}
    >
      <SectionHeader listingKind={listingKind} description={description} />

      <Suspense
        key={`comparison-${listingKind}-${searchKey}`}
        fallback={<ComparisonBarSkeleton loading />}
      >
        <SectionComparison query={query} listingKind={listingKind} />
      </Suspense>

      <PanelGrid panels={dataPanels} query={query} searchKey={searchKey} />

      <LinkOutPanelsSection
        panels={linkOutPanels}
        listingKind={listingKind}
        query={query}
        searchKey={searchKey}
      />

      <MarketplacePanelsEmptyHint listingKind={listingKind} />
    </section>
  );
}
