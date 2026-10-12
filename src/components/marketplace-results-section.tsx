import { Suspense } from "react";

import {
  ComparisonBarForKind,
  ComparisonBarSkeleton,
} from "@/components/comparison-bar";
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
  withTopRule = false,
  children,
}: {
  listingKind: ListingKind;
  /** Extra top rule and padding before the active section. */
  withTopRule?: boolean;
  children: React.ReactNode;
}) {
  const isSold = listingKind === "sold";

  return (
    <header
      className={[
        "border-b pb-4",
        isSold ? "border-accent/25" : "border-border-subtle",
        withTopRule
          ? "mt-8 border-t border-border-subtle pt-6"
          : "pt-1",
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
    <SectionHeaderFrame
      listingKind={listingKind}
      withTopRule={listingKind === "active"}
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

function SectionHeaderSkeleton({ listingKind }: { listingKind: ListingKind }) {
  const isSold = listingKind === "sold";
  const { title, eyebrow } = sectionCopy(listingKind);

  return (
    <SectionHeaderFrame
      listingKind={listingKind}
      withTopRule={listingKind === "active"}
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
      <div className="mt-2 h-4 w-full max-w-lg rounded bg-surface-muted animate-pulse" />
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
        <Suspense
          key={`${searchId}-${searchKey}`}
          fallback={
            <MarketplaceCardSkeleton marketplace={id} label={label} loading />
          }
        >
          <MarketplaceLoadTracker searchId={searchId}>
            <MarketplaceResultCard searchId={searchId} query={query} />
          </MarketplaceLoadTracker>
        </Suspense>
      ))}
    </div>
  );
}

async function SectionComparison({
  query,
  listingKind,
}: {
  query: SearchQuery;
  listingKind: ListingKind;
}) {
  const results = await searchAllMarketplaces(query);
  return <ComparisonBarForKind results={results} listingKind={listingKind} />;
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

  return (
    <section
      aria-labelledby={sectionHeadingId(listingKind)}
      className={className ?? "space-y-6"}
    >
      <SectionHeaderSkeleton listingKind={listingKind} />
      <ComparisonBarSkeleton loading={loading} />
      <div className="grid gap-5 md:grid-cols-2">
        {panels.map(({ searchId, id, label }) => (
          <MarketplaceCardSkeleton
            key={searchId}
            marketplace={id}
            label={label}
            loading={loading}
          />
        ))}
      </div>
    </section>
  );
}

export function MarketplaceResultsSection({
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
  const panels = marketplacePanelsForKind(listingKind);
  if (panels.length === 0) return null;

  const dataPanels = panels.filter((panel) => !panel.linkOut);
  const linkOutPanels = panels.filter((panel) => panel.linkOut);

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

      {linkOutPanels.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Search on site
          </p>
          <p className="text-sm text-muted">
            Open these marketplaces with the same query when in-app comps
            aren&apos;t available here.
          </p>
          <PanelGrid panels={linkOutPanels} query={query} searchKey={searchKey} />
        </div>
      ) : null}
    </section>
  );
}
