import { CircleLoader } from "@/components/circle-loader";
import { MARKETPLACE_THEME } from "@/components/marketplace-theme";
import {
  formatCentsRounded,
  formatCount,
  formatPercentDelta,
} from "@/lib/format";
import type {
  MarketplaceResult,
  PriceStats,
} from "@/lib/marketplaces/types";
import { computeBlendedStats } from "@/lib/stats";

type PricedResult = MarketplaceResult & { stats: PriceStats };

export function ComparisonBarSkeleton({ loading = true }: { loading?: boolean }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm">
      {loading ? (
        <CircleLoader label="Building comparison…" className="py-4" />
      ) : (
        <div className="animate-pulse space-y-3">
          <div className="h-10 w-48 rounded-md bg-surface-muted" />
          <div className="h-24 rounded-md bg-surface-muted" />
        </div>
      )}
    </div>
  );
}

export function ComparisonBar({ results }: { results: MarketplaceResult[] }) {
  const priced = results.filter(
    (result): result is PricedResult => result.stats !== null,
  );
  if (priced.length === 0) return null;

  const blended = computeBlendedStats(results.map((result) => result.listings));
  const highest = Math.max(
    ...priced.map((result) => result.stats.trimmedMeanCents),
  );

  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            Average across marketplaces
          </h2>
          {blended ? (
            <>
              <p className="text-4xl font-bold text-foreground tabular">
                {formatCentsRounded(
                  blended.stats.trimmedMeanCents,
                  blended.stats.currency,
                )}
              </p>
              <p className="mt-1 text-sm text-muted">
                {`${formatCount(blended.stats.count, "comp")} from ${formatCount(blended.marketplaceCount, "marketplace")}`}
              </p>
            </>
          ) : (
            <p className="mt-1 max-w-md text-sm text-muted">
              Marketplaces reported different currencies, so a combined average
              would be misleading. Compare the per-site figures below instead.
            </p>
          )}
        </div>

        {priced.length > 1 ? (
          <p className="text-sm text-muted">
            Best average:{" "}
            <span className="font-semibold text-foreground">
              {
                priced.reduce((best, result) =>
                  result.stats.trimmedMeanCents > best.stats.trimmedMeanCents
                    ? result
                    : best,
                ).label
              }
            </span>
          </p>
        ) : null}
      </div>

      <ul className="mt-5 space-y-3">
        {priced.map((result) => {
          const { stats } = result;
          return (
            <li key={result.marketplace} className="flex items-center gap-2 sm:gap-3">
              <span className="w-16 shrink-0 text-sm font-medium text-foreground sm:w-20">
                {result.label}
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <span
                  className={`block h-full rounded-full ${MARKETPLACE_THEME[result.marketplace].bar}`}
                  style={{
                    width: `${Math.max((stats.trimmedMeanCents / highest) * 100, 3)}%`,
                  }}
                />
              </span>
              <span className="w-16 shrink-0 text-right text-sm font-semibold text-foreground tabular sm:w-20">
                {formatCentsRounded(stats.trimmedMeanCents, stats.currency)}
              </span>
              <span className="hidden w-12 shrink-0 text-right text-xs text-muted tabular sm:block">
                {blended
                  ? formatPercentDelta(
                      stats.trimmedMeanCents,
                      blended.stats.trimmedMeanCents,
                    )
                  : ""}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-muted">
        Bars show the trimmed mean; the percentage compares each site to the
        blended average.
      </p>
    </section>
  );
}
