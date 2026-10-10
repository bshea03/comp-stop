import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import {
  decodeHtmlEntities,
  fetchMarketplaceHtml,
} from "@/lib/marketplaces/live/http";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

/**
 * Depop search SSR includes active listings only. Sold items are not searchable
 * by keyword; we surface asking prices from the public search page.
 */
export async function searchDepopActive(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  const params = new URLSearchParams({ q: keywordString(query) });
  const url = `https://www.depop.com/search/?${params.toString()}`;

  const html = await fetchMarketplaceHtml(url, signal);
  const listings = parseDepopSearchHtml(html, query.limit);

  if (listings.length === 0 && html.length < 5_000) {
    throw new Error(
      "Depop blocked the request or returned an empty page. Try again later or search Depop directly.",
    );
  }

  return listings;
}

export function parseDepopSearchHtml(html: string, limit: number): SoldListing[] {
  const cardRe =
    /<li class="styles-module__B382Gq__listItem">([\s\S]*?)<\/li>/g;

  const listings: SoldListing[] = [];
  const listedAt = new Date().toISOString();

  for (const cardMatch of html.matchAll(cardRe)) {
    const card = cardMatch[1];
    const href = card.match(/href="(\/products\/[^"]+)"/)?.[1];
    const label = card.match(/aria-label="([^"]+)"/)?.[1];
    if (!href || !label) continue;

    const brand = card.match(
      /styles-module__DwMxCG__brandName">([^<]+)</,
    )?.[1];
    const size = card.match(
      /styles-module__DwMxCG__sizeAttributeText">([^<]+)</,
    )?.[1];

    const discounted = card.match(
      /aria-description="Discounted price">\$([0-9]+(?:\.[0-9]{2})?)/,
    )?.[1];
    const regular = card.match(
      /aria-description="Price">\$([0-9]+(?:\.[0-9]{2})?)/,
    )?.[1];
    const dollars = discounted ?? regular;
    if (!dollars) continue;

    const imageUrl = card.match(/class="_mainImage[^"]*"[^>]*src="([^"]+)"/)?.[1];

    const slug = href.replace(/^\/products\//, "").replace(/\/$/, "");
    listings.push({
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
    });

    if (listings.length >= limit) break;
  }

  return listings;
}
