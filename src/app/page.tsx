import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { SearchFiltersFooter } from "@/components/search-filters-footer";
import { EmptyState } from "@/components/empty-state";
import { MockDataNoticeBlock } from "@/components/mock-data-notice-block";
import { MarketplaceResultsSection } from "@/components/marketplace-results-section";
import { MarketplaceResultsSectionSkeleton } from "@/components/marketplace-results-section-skeleton";
import { ResultsViewTabs } from "@/components/results-view-tabs";
import { ResultsLoadingShell } from "@/components/results-loading-shell";
import { MarketplaceVisibilityProvider } from "@/components/marketplace-visibility";
import { SearchStateProvider } from "@/components/search-state";
import { SearchForm, SearchFormSkeleton } from "@/components/search-form";
import { buildSearchParams } from "@/lib/schema";
import type { SearchQuery } from "@/lib/marketplaces/types";
import { parseSearchParams, TIME_WINDOWS } from "@/lib/schema";

function QueryRecap({ query }: { query: SearchQuery }) {
  const window = TIME_WINDOWS.find((option) => option.days === query.daysBack);
  const filters = [
    query.brand && `brand ${query.brand}`,
    query.size && `size ${query.size}`,
    query.condition && query.condition.toLowerCase(),
    (window?.label ?? `last ${query.daysBack} days`).toLowerCase(),
  ].filter(Boolean);

  return (
    <p className="text-sm text-muted">
      Comps for{" "}
      <span className="font-semibold text-foreground">{query.keywords}</span>
      {filters.length > 0 ? ` - ${filters.join(", ")}` : null}
    </p>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const rawParams = await searchParams;
  const query = parseSearchParams(rawParams);
  if (!query) return <EmptyState />;

  const searchKey = buildSearchParams(query);
  return (
    <ResultsLoadingShell
      showResults
      recap={<QueryRecap query={query} />}
    >
      <div className="space-y-6">
        <Suspense key={`notice-${searchKey}`}>
          <MockDataNoticeBlock query={query} />
        </Suspense>

        <ResultsViewTabs
          sold={
            <MarketplaceResultsSection
              listingKind="sold"
              query={query}
              searchKey={searchKey}
            />
          }
          active={
            <MarketplaceResultsSection
              listingKind="active"
              query={query}
              searchKey={searchKey}
            />
          }
        />

        <SearchFiltersFooter query={query} />
      </div>
    </ResultsLoadingShell>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div
        className="h-[4.25rem] animate-pulse rounded-xl bg-surface-muted sm:h-14"
        aria-hidden
      />
      <MarketplaceResultsSectionSkeleton listingKind="sold" loading />
    </div>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-14">
      <SiteHeader />

      <div className="mt-6 space-y-6">
        <MarketplaceVisibilityProvider>
          <SearchStateProvider>
            <Suspense fallback={<SearchFormSkeleton />}>
              <SearchForm />
            </Suspense>

            <Suspense fallback={<ResultsSkeleton />}>
              <Results searchParams={searchParams} />
            </Suspense>
          </SearchStateProvider>
        </MarketplaceVisibilityProvider>
      </div>
    </main>
  );
}
