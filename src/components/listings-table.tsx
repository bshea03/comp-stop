import { ListingThumbnail } from "@/components/listing-thumbnail";
import type { MarketplaceResult, SoldListing } from "@/lib/marketplaces/types";
import { formatCents, formatCount, formatDate } from "@/lib/format";

function ListingRow({ listing }: { listing: SoldListing }) {
  const meta = [listing.size, listing.condition].filter(Boolean).join(" \u00b7 ");

  return (
    <tr className="border-t border-border-subtle align-top">
      <td className="py-2 pr-3">
        <ListingThumbnail listing={listing} />
      </td>
      <td className="py-2 pr-3">
        <a
          href={listing.url}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-foreground underline decoration-border-subtle decoration-1 underline-offset-2 transition hover:decoration-accent"
        >
          {listing.title}
        </a>
        {meta ? (
          <span className="mt-0.5 block text-xs text-muted">{meta}</span>
        ) : null}
      </td>
      <td className="py-2 pr-3 whitespace-nowrap text-muted tabular">
        {formatDate(listing.soldAt)}
      </td>
      <td className="py-2 text-right font-semibold whitespace-nowrap tabular">
        {formatCents(listing.priceCents, listing.currency)}
      </td>
    </tr>
  );
}

const PREVIEW_COUNT = 6;

function PhotoStrip({ listings }: { listings: SoldListing[] }) {
  const preview = listings.slice(0, PREVIEW_COUNT);
  const overflow = listings.length - preview.length;

  return (
    <ul className="mb-3 flex flex-wrap gap-1.5" aria-hidden>
      {preview.map((listing) => (
        <li key={listing.id}>
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

export function ListingsTable({ result }: { result: MarketplaceResult }) {
  if (result.listings.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border-subtle pt-3">
      <p className="mb-2 text-xs text-muted">
        Photos help confirm the sold item matches what you searched for.
      </p>
      <PhotoStrip listings={result.listings} />

      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-medium text-muted transition hover:text-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="transition group-open:rotate-90" aria-hidden>
              &rsaquo;
            </span>
            {`View ${formatCount(result.listings.length, "comp")}`}
          </span>
        </summary>

      <div className="mt-3 max-h-80 overflow-x-auto overflow-y-auto pr-1 sm:pr-3">
        <table className="min-w-[28rem] w-full text-left text-sm">
          <thead className="text-xs font-medium uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="pb-2 pr-3 font-medium">
                <span className="sr-only">Photo</span>
              </th>
              <th scope="col" className="pb-2 pr-3 font-medium">
                Item
              </th>
              <th scope="col" className="pb-2 pr-3 font-medium">
                Sold
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {result.listings.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </tbody>
        </table>
      </div>
      </details>
    </div>
  );
}
