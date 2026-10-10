import { Suspense } from "react";

import {
  ComparisonBar,
  ComparisonBarSkeleton,
} from "@/components/comparison-bar";
import { EmptyState } from "@/components/empty-state";
import {
  MarketplaceCard,
  MarketplaceCardSkeleton,
} from "@/components/marketplace-card";
import { MockDataNotice } from "@/components/mock-data-notice";
import { ResultsLoadingShell } from "@/components/results-loading-shell";
import {
  MarketplaceLoadTracker,
  SearchStateProvider,
} from "@/components/search-state";
import { SearchForm, SearchFormSkeleton } from "@/components/search-form";
import { buildSearchParams } from "@/lib/schema";
import type { MarketplaceId, SearchQuery } from "@/lib/marketplaces/types";
import { parseSearchParams, TIME_WINDOWS } from "@/lib/schema";
import {
  REGISTERED_MARKETPLACES,
  searchAllMarketplaces,
  searchMarketplace,
} from "@/lib/search-service";

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
      Sold comps for{" "}
      <span className="font-semibold text-foreground">{query.keywords}</span>
      {filters.length > 0 ? ` - ${filters.join(", ")}` : null}
    </p>
  );
}

async function SummaryBlock({ query }: { query: SearchQuery }) {
  const results = await searchAllMarketplaces(query);
  return (
    <div className="space-y-4">
      <MockDataNotice results={results} />
      <ComparisonBar results={results} />
    </div>
  );
}

async function MarketplaceResultCard({
  marketplace,
  query,
}: {
  marketplace: MarketplaceId;
  query: SearchQuery;
}) {
  return (
    <MarketplaceCard result={await searchMarketplace(marketplace, query)} />
  );
}

async function Results({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const query = parseSearchParams(await searchParams);
  if (!query) return <EmptyState />;

  const searchKey = buildSearchParams(query);

  return (
    <ResultsLoadingShell
      showResults
      marketplaces={REGISTERED_MARKETPLACES}
      recap={<QueryRecap query={query} />}
    >
      <div className="space-y-6">
        <QueryRecap query={query} />

        <Suspense
          key={`summary-${searchKey}`}
          fallback={<ComparisonBarSkeleton loading />}
        >
          <SummaryBlock query={query} />
        </Suspense>

        <div className="grid gap-5 md:grid-cols-2">
          {REGISTERED_MARKETPLACES.map(({ id, label }) => (
            <Suspense
              key={`${id}-${searchKey}`}
              fallback={
                <MarketplaceCardSkeleton
                  marketplace={id}
                  label={label}
                  loading
                />
              }
            >
              <MarketplaceLoadTracker marketplace={id}>
                <MarketplaceResultCard marketplace={id} query={query} />
              </MarketplaceLoadTracker>
            </Suspense>
          ))}
        </div>
      </div>
    </ResultsLoadingShell>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <ComparisonBarSkeleton loading />
      <div className="grid gap-5 md:grid-cols-2">
        {REGISTERED_MARKETPLACES.map(({ id, label }) => (
          <MarketplaceCardSkeleton
            key={id}
            marketplace={id}
            label={label}
            loading
          />
        ))}
      </div>
    </div>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-14">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          CompStop
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Compare sold and active comps on eBay, Poshmark, Vinted, and Depop
          before you buy.
        </p>
      </header>

      <div className="mt-6 space-y-6">
        <SearchStateProvider>
          <Suspense fallback={<SearchFormSkeleton />}>
            <SearchForm />
          </Suspense>

          <Suspense fallback={<ResultsSkeleton />}>
            <Results searchParams={searchParams} />
          </Suspense>
        </SearchStateProvider>
      </div>
    </main>
  );
}
