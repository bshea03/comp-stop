import { parseDepopRscSearchHtml } from "@/lib/marketplaces/depop/parse-rsc-products";
import { decodeHtmlEntities } from "@/lib/marketplaces/live/http";
import type { SoldListing } from "@/lib/marketplaces/types";

function mapCardToListing(card: string, listedAt: string): SoldListing | null {
  const href = card.match(/href="(\/products\/[^"]+)"/)?.[1];
  const label = card.match(/aria-label="([^"]+)"/)?.[1];
  if (!href || !label) return null;

  const brand = card.match(/styles-module__[^"]*__brandName">([^<]+)</)?.[1];
  const size = card.match(
    /styles-module__[^"]*__sizeAttributeText">([^<]+)</,
  )?.[1];

  const discounted = card.match(
    /aria-description="Discounted price">\$([0-9]+(?:\.[0-9]{2})?)/,
  )?.[1];
  const regular = card.match(
    /aria-description="Price">\$([0-9]+(?:\.[0-9]{2})?)/,
  )?.[1];
  const dollars = discounted ?? regular;
  if (!dollars) return null;

  const imageUrl =
    card.match(/class="_mainImage[^"]*"[^>]*src="([^"]+)"/)?.[1] ??
    card.match(/src="(https:\/\/[^"]+media[^"]+)"/)?.[1];

  const slug = href.replace(/^\/products\//, "").replace(/\/$/, "");
  return {
    id: slug,
    marketplace: "depop",
    title: decodeHtmlEntities(label),
    brand: brand ? decodeHtmlEntities(brand) : undefined,
    size: size ? decodeHtmlEntities(size) : undefined,
    priceCents: Math.round(parseFloat(dollars) * 100),
    currency: "USD",
    soldAt: listedAt,
    url: `https://www.depop.com${href}`,
    imageUrl,
  };
}

function parseDepopListCards(html: string, limit: number): SoldListing[] {
  const cardRe =
    /<li class="styles-module__[^"]*__listItem">([\s\S]*?)<\/li>/g;

  const listings: SoldListing[] = [];
  const listedAt = new Date().toISOString();

  for (const cardMatch of html.matchAll(cardRe)) {
    const mapped = mapCardToListing(cardMatch[1], listedAt);
    if (mapped) listings.push(mapped);
    if (listings.length >= limit) break;
  }

  return listings;
}

/** Fallback when hashed CSS module class names change. */
function parseDepopProductAnchors(html: string, limit: number): SoldListing[] {
  const anchorRe =
    /<a\b[^>]*href="(\/products\/[^"?#]+)"[^>]*aria-label="([^"]+)"[^>]*>/gi;

  const listings: SoldListing[] = [];
  const listedAt = new Date().toISOString();
  const seen = new Set<string>();

  for (const match of html.matchAll(anchorRe)) {
    const href = match[1];
    const label = match[2];
    const slug = href.replace(/^\/products\//, "").replace(/\/$/, "");
    if (seen.has(slug)) continue;
    seen.add(slug);

    const start = Math.max(0, match.index ?? 0);
    const window = html.slice(start, start + 2_000);
    const dollars =
      window.match(
        /aria-description="Discounted price">\$([0-9]+(?:\.[0-9]{2})?)/,
      )?.[1] ??
      window.match(/aria-description="Price">\$([0-9]+(?:\.[0-9]{2})?)/)?.[1];
    if (!dollars) continue;

    listings.push({
      id: slug,
      marketplace: "depop",
      title: decodeHtmlEntities(label),
      priceCents: Math.round(parseFloat(dollars) * 100),
      currency: "USD",
      soldAt: listedAt,
      url: `https://www.depop.com${href}`,
      imageUrl: window.match(/src="(https:\/\/[^"]+)"/)?.[1],
    });

    if (listings.length >= limit) break;
  }

  return listings;
}

export function parseDepopSearchHtml(html: string, limit: number): SoldListing[] {
  const fromCards = parseDepopListCards(html, limit);
  if (fromCards.length > 0) return fromCards;
  const fromAnchors = parseDepopProductAnchors(html, limit);
  if (fromAnchors.length > 0) return fromAnchors;
  return parseDepopRscSearchHtml(html, limit);
}

export function isDepopBlockedHtml(html: string): boolean {
  if (parseDepopRscSearchHtml(html, 1).length > 0) return false;
  if (html.length < 5_000) return true;
  if (/Forbidden\s*-\s*Depop/i.test(html)) return true;
  if (/cf-browser-verification|challenge-platform/i.test(html)) return true;
  return false;
}
