import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import { decodeHtmlEntities, marketplaceFetch } from "@/lib/marketplaces/live/http";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

/**
 * Vinted removes sold items, so catalog HTML only exposes active listings.
 * We parse SSR markup and treat listed prices as comp hints, not sold comps.
 */
export async function searchVintedActive(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  const params = new URLSearchParams({ search_text: keywordString(query) });
  const url = `https://www.vinted.com/catalog?${params.toString()}`;

  const response = await marketplaceFetch(url, signal, {
    headers: { Accept: "text/html" },
  });

  if (!response.ok) {
    throw new Error(`Vinted returned HTTP ${response.status}.`);
  }

  const html = await response.text();
  return parseVintedCatalogHtml(html, query.limit);
}

function extractVintedImageUrl(html: string, id: string): string | undefined {
  const marker = `product-item-id-${id}--image--img`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return undefined;

  const chunk = html.slice(Math.max(0, markerIndex - 500), markerIndex + 120);
  return chunk.match(/src="(https:\/\/images\d+\.vinted\.net\/[^"]+)"/)?.[1];
}

function parseTitleAttribute(titleAttr: string): {
  title: string;
  brand?: string;
  condition?: string;
  size?: string;
  priceCents: number;
} {
  const decoded = decodeHtmlEntities(titleAttr);
  const priceMatch = decoded.match(/,\s*([0-9]+(?:\.[0-9]{2})?)\s*\$/);
  const priceCents = priceMatch
    ? Math.round(parseFloat(priceMatch[1]) * 100)
    : 0;

  const title = decoded.split(", Brand:")[0]?.trim() ?? decoded;
  const brand = decoded.match(/Brand:\s*([^,]+)/)?.[1]?.trim();
  const condition = decoded.match(/Condition:\s*([^,]+)/)?.[1]?.trim();
  const size = decoded.match(/Size:\s*([^,]+)/)?.[1]?.trim();

  return { title, brand, condition, size, priceCents };
}

export function parseVintedCatalogHtml(
  html: string,
  limit: number,
): SoldListing[] {
  const itemRe =
    /data-testid="product-item-id-(\d+)--overlay-link" title="([^"]+)"/g;

  const listings: SoldListing[] = [];
  const seen = new Set<string>();
  const listedAt = new Date().toISOString();

  for (const match of html.matchAll(itemRe)) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const { title, brand, condition, size, priceCents } = parseTitleAttribute(
      match[2],
    );
    if (priceCents <= 0) continue;

    const hrefRe = new RegExp(`href="(/items/${id}[^"]*)"`);
    const href = html.match(hrefRe)?.[1];
    if (!href) continue;

    const imageUrl = extractVintedImageUrl(html, id);

    listings.push({
      id,
      marketplace: "vinted",
      title,
      brand,
      size,
      condition,
      priceCents,
      currency: "USD",
      soldAt: listedAt,
      url: `https://www.vinted.com${href}`,
      imageUrl,
    });

    if (listings.length >= limit) break;
  }

  return listings;
}
