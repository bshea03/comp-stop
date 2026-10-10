import Image from "next/image";

import { findGarmentColor } from "@/lib/garment-colors";
import type { SoldListing } from "@/lib/marketplaces/types";

const SIZE_PX = 64;

function isRemotePhoto(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("http://");
}

/** Vinted CDN URLs require signed query params; load them directly in the browser. */
function prefersNativeImage(url: string): boolean {
  return url.includes("vinted.net");
}

/** Up to two letters to label a listing that has no photo. */
function initials(listing: SoldListing): string {
  const source = listing.brand ?? listing.title;
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Stand-in for a listing with no photo. It is deliberately a flat swatch
 * rather than a stock image: it carries the garment color named in the title,
 * which is a real identity signal, without pretending to be the actual item.
 */
function ColorSwatch({ listing }: { listing: SoldListing }) {
  const color = findGarmentColor(listing.title);
  const label = color ? `${color.name}, no photo available` : "No photo available";

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={
        color ? { backgroundColor: color.hex, color: color.ink } : undefined
      }
      className={
        color
          ? "flex size-full items-center justify-center text-sm font-semibold"
          : "flex size-full items-center justify-center bg-surface-muted text-sm font-semibold text-muted"
      }
    >
      {initials(listing)}
    </span>
  );
}

function Photo({ listing, src }: { listing: SoldListing; src: string }) {
  const classes = "size-full object-cover";

  // Mock adapters emit SVG data URLs; next/image does not optimize those.
  // Live adapters return https URLs and go through the image optimizer.
  if (isRemotePhoto(src) && prefersNativeImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={listing.title}
        width={SIZE_PX}
        height={SIZE_PX}
        className={classes}
        loading="lazy"
        decoding="async"
      />
    );
  }

  if (isRemotePhoto(src)) {
    return (
      <Image
        src={src}
        alt={listing.title}
        width={SIZE_PX}
        height={SIZE_PX}
        className={classes}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={listing.title} width={SIZE_PX} height={SIZE_PX} className={classes} />
  );
}

export function ListingThumbnail({ listing }: { listing: SoldListing }) {
  const frame =
    "block size-14 shrink-0 overflow-hidden rounded-md border border-border-subtle bg-surface-muted sm:size-16";

  const content = listing.imageUrl ? (
    <Photo listing={listing} src={listing.imageUrl} />
  ) : (
    <ColorSwatch listing={listing} />
  );

  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noreferrer noopener"
      // The title link already names the item, so this duplicate link is
      // hidden from screen readers rather than read out twice.
      tabIndex={-1}
      aria-hidden
      className={`${frame} transition hover:border-accent`}
    >
      {content}
    </a>
  );
}
