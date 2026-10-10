import { GARMENT_COLORS } from "@/lib/garment-colors";
import {
  classifyGarment,
  mockGarmentImageUrl,
} from "@/lib/marketplaces/mock/garment-image";
import { createRng, hashString } from "@/lib/marketplaces/mock/seeded-random";
import type {
  MarketplaceId,
  SearchQuery,
  SoldListing,
} from "@/lib/marketplaces/types";

export type MockProfile = {
  /** Median sold price in cents for an unremarkable garment on this site. */
  basePriceCents: number;
  /** Lognormal sigma: how widely comps spread around the median. */
  priceSpread: number;
  /** How many comps the site tends to surface for a query. */
  volume: { min: number; max: number };
  currency: string;
  /** Simulated latency range in ms, so the streaming UI is exercised. */
  latencyMs: { min: number; max: number };
};

/**
 * Resale multipliers for brands that show up often in clothes flipping.
 * Unknown brands get a stable multiplier derived from their name instead, so
 * every search returns something plausible.
 */
const BRAND_MULTIPLIERS: Record<string, number> = {
  "arc'teryx": 3.4,
  patagonia: 2.3,
  "the north face": 1.9,
  carhartt: 1.7,
  "stone island": 4.6,
  "supreme": 3.8,
  "ralph lauren": 1.4,
  "polo ralph lauren": 1.5,
  nike: 1.2,
  adidas: 1.1,
  lululemon: 1.8,
  "harley davidson": 2.1,
  pendleton: 1.6,
  levis: 1.3,
  "levi's": 1.3,
  zara: 0.7,
  "h&m": 0.5,
  shein: 0.3,
  uniqlo: 0.8,
  gap: 0.6,
  "free people": 1.4,
  anthropologie: 1.3,
  "lilly pulitzer": 1.7,
  "eileen fisher": 1.5,
  vintage: 1.5,
};

const CONDITION_MULTIPLIERS: Record<string, number> = {
  "New with tags": 1.35,
  "New without tags": 1.15,
  Excellent: 1.0,
  Good: 0.82,
  Fair: 0.6,
};

const DESCRIPTORS = [
  "Vintage",
  "Y2K",
  "Deadstock",
  "Retro",
  "90s",
  "80s",
  "Rare",
  "NWT",
  "Streetwear",
  "Classic",
] as const;

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

const CONDITION_POOL = [
  "New with tags",
  "New without tags",
  "Excellent",
  "Good",
  "Fair",
] as const;

const DAY_MS = 86_400_000;

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function brandMultiplier(brand: string | undefined): number {
  if (!brand) return 1;
  const known = BRAND_MULTIPLIERS[brand.trim().toLowerCase()];
  if (known !== undefined) return known;
  // Stable 0.7x-2.4x for brands we have no table entry for.
  return 0.7 + (hashString(brand.toLowerCase()) % 1700) / 1000;
}

/** Cache key for the generator: everything that should change the comps. */
function seedFor(marketplace: MarketplaceId, query: SearchQuery): string {
  return [
    marketplace,
    query.keywords.trim().toLowerCase(),
    query.brand?.trim().toLowerCase() ?? "",
    query.size?.trim().toLowerCase() ?? "",
    query.condition ?? "",
    query.daysBack,
  ].join("|");
}

export function generateMockListings(options: {
  marketplace: MarketplaceId;
  query: SearchQuery;
  profile: MockProfile;
  listingUrl: string;
  /** Reference time for the sold-date window. */
  now?: number;
}): SoldListing[] {
  const { marketplace, query, profile, listingUrl } = options;
  const now = options.now ?? Date.now();
  const rng = createRng(seedFor(marketplace, query));

  const keywordLabel = titleCase(query.keywords);
  const kind = classifyGarment(query.keywords);
  const median = profile.basePriceCents * brandMultiplier(query.brand);
  const count = Math.min(
    rng.int(profile.volume.min, profile.volume.max),
    query.limit,
  );

  const listings: SoldListing[] = [];
  for (let i = 0; i < count; i += 1) {
    const condition = query.condition ?? rng.pick(CONDITION_POOL);
    const size = query.size ?? rng.pick(SIZES);
    // Clamping the normal sample keeps the long tail of a lognormal price
    // distribution without producing comps that are absurd for the garment.
    const z = Math.max(-2.5, Math.min(2.5, rng.normal()));
    const spread = Math.exp(profile.priceSpread * z);
    const priceCents = Math.max(
      300,
      Math.round(
        (median * spread * (CONDITION_MULTIPLIERS[condition] ?? 1)) / 50,
      ) * 50,
    );

    const color = rng.pick(GARMENT_COLORS);
    const titleParts = [
      rng.bool(0.45) ? rng.pick(DESCRIPTORS) : null,
      query.brand ? titleCase(query.brand) : null,
      rng.bool(0.6) ? color.name : null,
      keywordLabel,
    ].filter(Boolean);

    const id = `${marketplace}-${hashString(`${seedFor(marketplace, query)}#${i}`).toString(36)}`;

    listings.push({
      id,
      marketplace,
      title: titleParts.join(" "),
      brand: query.brand ? titleCase(query.brand) : undefined,
      size,
      condition,
      priceCents,
      currency: profile.currency,
      soldAt: new Date(
        now - Math.floor(rng.float(0, query.daysBack) * DAY_MS),
      ).toISOString(),
      url: listingUrl,
      imageUrl: mockGarmentImageUrl({ kind, color, seed: id }),
    });
  }

  return listings.sort((a, b) => b.soldAt.localeCompare(a.soldAt));
}

/** Stands in for network latency so Suspense fallbacks are visible. */
export function mockLatency(
  marketplace: MarketplaceId,
  query: SearchQuery,
  profile: MockProfile,
): number {
  const rng = createRng(`latency|${seedFor(marketplace, query)}`);
  return rng.int(profile.latencyMs.min, profile.latencyMs.max);
}

export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
