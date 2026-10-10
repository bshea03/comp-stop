import type { SoldListing } from "@/lib/marketplaces/types";

type DepopRscProduct = {
  id?: number;
  slug?: string;
  status?: string;
  brand_name?: string;
  sizes?: string[];
  pictures?: Array<Record<string, string>>;
  preview?: Record<string, string>;
  pricing?: {
    is_reduced?: boolean;
    currency_name?: string;
    original_price?: {
      price_breakdown?: { price?: { amount?: string } };
    };
    discounted_price?: {
      price_breakdown?: { price?: { amount?: string } };
    };
  };
};

function extractJsonArray(html: string, needle: string): string | null {
  const idx = html.indexOf(needle);
  if (idx < 0) return null;
  const open = html.indexOf("[", idx + needle.length - 1);
  if (open < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = open; i < html.length; i++) {
    const ch = html[i]!;
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return html.slice(open, i + 1);
    }
  }

  return null;
}

function titleFromDepopSlug(slug: string): string {
  const parts = slug.split("-");
  while (parts.length > 1 && /^[a-f0-9]{4}$/i.test(parts.at(-1)!)) {
    parts.pop();
  }
  if (parts.length > 1) parts.shift();
  const words = parts.join(" ").trim();
  if (!words) return slug;
  return words.replace(/\b\w/g, (c) => c.toUpperCase());
}

function productPriceAmount(product: DepopRscProduct): string | null {
  const pricing = product.pricing;
  if (!pricing) return null;
  if (pricing.is_reduced) {
    return (
      pricing.discounted_price?.price_breakdown?.price?.amount ??
      pricing.original_price?.price_breakdown?.price?.amount ??
      null
    );
  }
  return pricing.original_price?.price_breakdown?.price?.amount ?? null;
}

function productImageUrl(product: DepopRscProduct): string | undefined {
  const fromPreview =
    product.preview?.["640"] ??
    product.preview?.["480"] ??
    product.preview?.["320"];
  if (fromPreview) return fromPreview;
  const pic = product.pictures?.[0];
  if (!pic) return undefined;
  return pic["640"] ?? pic["480"] ?? pic["320"] ?? Object.values(pic)[0];
}

function mapRscProduct(product: DepopRscProduct, listedAt: string): SoldListing | null {
  const slug = product.slug?.trim();
  if (!slug) return null;
  if (product.status && product.status !== "ONSALE") return null;

  const dollars = productPriceAmount(product);
  if (!dollars) return null;

  const currency = product.pricing?.currency_name ?? "USD";

  return {
    id: slug,
    marketplace: "depop",
    title: titleFromDepopSlug(slug),
    brand: product.brand_name?.trim() || undefined,
    size: product.sizes?.[0]?.trim() || undefined,
    priceCents: Math.round(parseFloat(dollars) * 100),
    currency,
    soldAt: listedAt,
    url: `https://www.depop.com/products/${slug}/`,
    imageUrl: productImageUrl(product),
  };
}

/** First-page search results embedded in Next.js RSC flight payloads. */
export function parseDepopRscSearchHtml(html: string, limit: number): SoldListing[] {
  const arrayJson = extractJsonArray(html, '"products":');
  if (!arrayJson) return [];

  let products: DepopRscProduct[];
  try {
    products = JSON.parse(arrayJson) as DepopRscProduct[];
  } catch {
    return [];
  }

  if (!Array.isArray(products)) return [];

  const listedAt = new Date().toISOString();
  const listings: SoldListing[] = [];

  for (const product of products) {
    const mapped = mapRscProduct(product, listedAt);
    if (mapped) listings.push(mapped);
    if (listings.length >= limit) break;
  }

  return listings;
}
