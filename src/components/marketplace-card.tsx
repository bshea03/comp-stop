import { ListingsTable } from "@/components/listings-table";
import { MARKETPLACE_THEME } from "@/components/marketplace-theme";
import {
  formatCentsRounded,
  formatDateRange,
} from "@/lib/format";
import type { MarketplaceId, MarketplaceResult } from "@/lib/marketplaces/types";

function CardShell({
  marketplace,
  label,
  badge,
  children,
}: {
  marketplace: MarketplaceId;
  label: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={`size-2.5 rounded-full ${MARKETPLACE_THEME[marketplace].dot}`}
          aria-hidden
        />
        <h2 className="text-base font-semibold text-foreground">{label}</h2>
        {badge}
      </header>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground tabular">
        {value}
      </dd>
    </div>
  );
}

export function MarketplaceCardSkeleton({
  marketplace,
  label,
}: {
  marketplace: MarketplaceId;
  label: string;
}) {
  return (
    <CardShell marketplace={marketplace} label={label}>
      <div className="mt-4 animate-pulse space-y-3">
        <div className="h-9 w-32 rounded-md bg-surface-muted" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-9 rounded-md bg-surface-muted" />
          <div className="h-9 rounded-md bg-surface-muted" />
          <div className="h-9 rounded-md bg-surface-muted" />
        </div>
        <div className="h-4 w-40 rounded-md bg-surface-muted" />
      </div>
    </CardShell>
  );
}

export function MarketplaceCard({ result }: { result: MarketplaceResult }) {
  const badge =
    result.dataSource === "mock" ? (
      <span className="ml-auto rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">
        Sample data
      </span>
    ) : result.listingKind === "active" ? (
      <span className="ml-auto rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-muted">
        Active listings
      </span>
    ) : (
      <span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
        Live sold
      </span>
    );

  if (result.status === "error") {
    return (
      <CardShell
        marketplace={result.marketplace}
        label={result.label}
        badge={badge}
      >
        <p className="mt-4 text-sm text-danger">
          Could not load comps. {result.error}
        </p>
        <a
          href={result.searchUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 text-sm font-medium text-accent hover:underline"
        >
          {`Search ${result.label} directly`}
        </a>
      </CardShell>
    );
  }

  if (!result.stats) {
    return (
      <CardShell
        marketplace={result.marketplace}
        label={result.label}
        badge={badge}
      >
        <p className="mt-4 text-sm text-muted">
          {result.listingKind === "sold"
            ? "No sold listings matched this search."
            : "No active listings matched this search."}
        </p>
        <a
          href={result.searchUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 text-sm font-medium text-accent hover:underline"
        >
          {`Search ${result.label} directly`}
        </a>
      </CardShell>
    );
  }

  const { stats } = result;

  return (
    <CardShell
      marketplace={result.marketplace}
      label={result.label}
      badge={badge}
    >
      {result.resultCaveat ? (
        <p className="mt-3 text-xs text-muted">{result.resultCaveat}</p>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {result.listingKind === "sold"
            ? "Average sold price"
            : "Average asking price"}
        </p>
        <p className="text-3xl font-bold text-foreground tabular">
          {formatCentsRounded(stats.trimmedMeanCents, stats.currency)}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-surface-muted p-3">
        <Stat
          label="Median"
          value={formatCentsRounded(stats.medianCents, stats.currency)}
        />
        <Stat
          label="Low"
          value={formatCentsRounded(stats.minCents, stats.currency)}
        />
        <Stat
          label="High"
          value={formatCentsRounded(stats.maxCents, stats.currency)}
        />
      </dl>

      <p className="mt-3 text-xs text-muted">
        {result.listingKind === "sold"
          ? `Sold ${formatDateRange(stats.oldestSoldAt, stats.newestSoldAt)}`
          : "Prices from listings currently for sale"}
      </p>

      <ListingsTable result={result} />

      <a
        href={result.searchUrl}
        target="_blank"
        rel="noreferrer noopener"
        title={
          result.marketplace === "ebay"
            ? "Opens eBay sold comps. Sign in with a free eBay account if prompted."
            : undefined
        }
        className="mt-4 text-sm font-medium text-accent hover:underline"
      >
        {result.marketplace === "ebay"
          ? result.listingKind === "active"
            ? "Verify active listings on eBay"
            : "Verify sold comps on eBay"
          : `Verify on ${result.label}`}
      </a>
    </CardShell>
  );
}
