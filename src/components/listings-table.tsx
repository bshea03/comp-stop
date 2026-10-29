"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ListingThumbnail } from "@/components/listing-thumbnail";
import { useResultsView } from "@/components/results-view-context";
import { formatListingCondition } from "@/lib/listings/condition-match";
import type { MarketplaceResult, SoldListing } from "@/lib/marketplaces/types";
import { formatCents, formatCount, formatDate } from "@/lib/format";

function listingMetaLine(listing: SoldListing): string | undefined {
  const parts = [
    listing.size,
    formatListingCondition(listing.condition),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/** Sold date gets its own column once the panel can fit it beside the price. */
const WIDE_LISTING_COLUMNS = "@min-[22rem]:block";

function DesktopListingRow({ listing }: { listing: SoldListing }) {
  const meta = listingMetaLine(listing);

  return (
    <div
      role="row"
      className="col-span-full grid grid-cols-subgrid items-start border-t border-border-subtle py-2"
    >
      <div role="cell">
        <ListingThumbnail listing={listing} />
      </div>
      <div role="cell" className="min-w-0">
        <a
          href={listing.url}
          target="_blank"
          rel="noreferrer noopener"
          className="break-words font-medium text-foreground underline decoration-border-subtle decoration-1 underline-offset-2 transition hover:decoration-accent"
        >
          {listing.title}
        </a>
        {meta ? (
          <span className="mt-0.5 block text-xs text-muted">{meta}</span>
        ) : null}
        <span className="mt-0.5 block text-xs text-muted tabular @min-[22rem]:hidden">
          {formatDate(listing.soldAt)}
        </span>
      </div>
      <div
        role="cell"
        className={`hidden whitespace-nowrap text-muted tabular ${WIDE_LISTING_COLUMNS}`}
      >
        {formatDate(listing.soldAt)}
      </div>
      <div
        role="cell"
        className="text-right font-semibold whitespace-nowrap tabular"
      >
        {formatCents(listing.priceCents, listing.currency)}
      </div>
    </div>
  );
}

function MobileListingCard({ listing }: { listing: SoldListing }) {
  const meta = listingMetaLine(listing);

  return (
    <li className="flex gap-3 py-4">
      <ListingThumbnail listing={listing} />
      <div className="min-w-0 flex-1">
        <a
          href={listing.url}
          target="_blank"
          rel="noreferrer noopener"
          className="block font-medium text-foreground underline decoration-border-subtle decoration-1 underline-offset-2 transition hover:decoration-accent"
        >
          {listing.title}
        </a>
        {meta ? <p className="mt-0.5 text-xs text-muted">{meta}</p> : null}
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold text-foreground tabular">
            {formatCents(listing.priceCents, listing.currency)}
          </span>
          <span className="text-muted tabular">{formatDate(listing.soldAt)}</span>
        </p>
      </div>
    </li>
  );
}

const PREVIEW_COUNT = 5;
const COMPS_PAGE_SIZE = 10;

function CompsLoadMore({
  visibleCount,
  total,
  onLoadMore,
}: {
  visibleCount: number;
  total: number;
  onLoadMore: () => void;
}) {
  if (visibleCount >= total) return null;

  const remaining = total - visibleCount;
  const nextCount = Math.min(COMPS_PAGE_SIZE, remaining);

  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <p className="mb-2 text-center text-xs text-muted">
        {`Showing ${visibleCount} of ${formatCount(total, "comp")}. Averages above use every comp.`}
      </p>
      <button
        type="button"
        onClick={onLoadMore}
        className={[
          "w-full rounded-lg border border-border-subtle bg-surface-muted/50 px-3 py-2.5",
          "text-sm font-medium text-foreground transition hover:bg-surface-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        ].join(" ")}
      >
        {nextCount === 1
          ? "Load 1 more comp"
          : `Load ${nextCount} more comps`}
      </button>
    </div>
  );
}

function listingRowKey(listing: SoldListing, index: number): string {
  return `${listing.marketplace}-${listing.id}-${index}`;
}

function PhotoStrip({ listings }: { listings: SoldListing[] }) {
  const preview = listings.slice(0, PREVIEW_COUNT);
  const overflow = listings.length - preview.length;

  return (
    <ul className="mb-3 flex flex-wrap gap-1.5" aria-hidden>
      {preview.map((listing, index) => (
        <li key={listingRowKey(listing, index)}>
          <ListingThumbnail listing={listing} />
        </li>
      ))}
      {overflow > 0 ? (
        <li className="flex size-14 items-center justify-center rounded-md border border-border-subtle bg-surface-muted text-xs font-semibold text-muted sm:size-16">
          {`+${overflow}`}
        </li>
      ) : null}
    </ul>
  );
}

function ListingsTableContent({ result }: { result: MarketplaceResult }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [visibleCount, setVisibleCount] = useState(COMPS_PAGE_SIZE);

  const resetVisibleCount = useCallback(() => {
    setVisibleCount(COMPS_PAGE_SIZE);
  }, []);

  useEffect(() => {
    const node = detailsRef.current;
    if (!node) return;

    function onToggle() {
      if (!node?.open) resetVisibleCount();
    }

    node.addEventListener("toggle", onToggle);
    return () => node.removeEventListener("toggle", onToggle);
  }, [resetVisibleCount]);

  const loadMore = useCallback(() => {
    setVisibleCount((count) =>
      Math.min(count + COMPS_PAGE_SIZE, result.listings.length),
    );
  }, [result.listings.length]);

  if (result.listings.length === 0) return null;

  const visibleListings = result.listings.slice(0, visibleCount);

  return (
    <div className="mt-4 min-w-0 border-t border-border-subtle pt-3">
      <p className="mb-2 text-xs text-muted">
        Photos help confirm the sold item matches what you searched for.
      </p>
      <PhotoStrip listings={result.listings} />

      <details ref={detailsRef} className="group min-w-0">
        <summary className="cursor-pointer list-none text-sm font-medium text-muted transition hover:text-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="transition group-open:rotate-90" aria-hidden>
              &rsaquo;
            </span>
            {`View ${formatCount(result.listings.length, "comp")}`}
          </span>
        </summary>

        <ul
          className={[
            "mt-3 max-h-[min(70dvh,28rem)] divide-y divide-border-subtle overflow-y-auto overscroll-y-contain",
            "pr-0.5 sm:hidden",
          ].join(" ")}
        >
          {visibleListings.map((listing, index) => (
            <MobileListingCard
              key={listingRowKey(listing, index)}
              listing={listing}
            />
          ))}
        </ul>

        <div className="@container mt-3 hidden max-h-80 min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain pr-3 sm:block">
          <div
            role="table"
            className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_auto] gap-x-3 text-left text-sm @min-[22rem]:grid-cols-[4rem_minmax(0,1fr)_auto_auto]"
          >
            <div
              role="row"
              className="col-span-full grid grid-cols-subgrid text-xs font-medium uppercase tracking-wide text-muted"
            >
              <div role="columnheader" className="pb-2">
                <span className="sr-only">Photo</span>
              </div>
              <div role="columnheader" className="pb-2">
                Item
              </div>
              <div
                role="columnheader"
                className={`hidden pb-2 ${WIDE_LISTING_COLUMNS}`}
              >
                Sold
              </div>
              <div role="columnheader" className="pb-2 text-right">
                Price
              </div>
            </div>
            {visibleListings.map((listing, index) => (
              <DesktopListingRow
                key={listingRowKey(listing, index)}
                listing={listing}
              />
            ))}
          </div>
        </div>

        <CompsLoadMore
          visibleCount={visibleCount}
          total={result.listings.length}
          onLoadMore={loadMore}
        />
      </details>
    </div>
  );
}

export function ListingsTable({ result }: { result: MarketplaceResult }) {
  const activeView = useResultsView();
  const panelView = result.listingKind;
  const resetKey = `${result.marketplace}|${result.listings.length}|${activeView === panelView}`;

  return <ListingsTableContent key={resetKey} result={result} />;
}
