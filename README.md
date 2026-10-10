# Reselling Helper

Search sold garment listings across eBay, Poshmark, Vinted, and Depop from one
query and compare the average sold price on each, so you know what a piece is
worth before you buy it.

Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, and
Zod.

## Running it

This repo uses [pnpm](https://pnpm.io/). Enable it once with `corepack enable`
(if Node ships Corepack), or install pnpm globally.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
pnpm lint       # eslint
pnpm typecheck  # tsc --noEmit
pnpm build      # production build
```

TypeScript is on **6.x** (`typescript-eslint` supports up to `<6.1.0`). **7.x**
can work for `tsc` and `next build`, but `eslint-config-next` / `typescript-eslint`
do not support it yet, so upgrading to TS 7 would break `pnpm lint`.

## Live vs mock data

By default the app calls the real marketplaces from the server (see
`.env.example`). Set `USE_MOCK_MARKETPLACES=1` to go back to deterministic
sample data for offline work.

| Marketplace | Default live source | What you get |
| ----------- | ------------------- | ------------ |
| Poshmark    | `GET /vm-rest/posts` with `inventory_status[]=sold_out` | **Sold** comps with photos and sold dates |
| eBay        | [SoldComps API](https://sold-comps.com/) (`SOLD_COMPS_API_KEY`) | **Sold** comps (final prices, ~90-day window) |
| Vinted      | Catalog search HTML | **Active** listings (Vinted removes sold items) |
| Depop       | Search page HTML | **Active** listings (sold items are not keyword-searchable) |

Cards label **Live sold**, **Active listings**, or **Sample data**. A banner
calls out mock adapters and any site that is live but not sold comps.

Copy `.env.example` to `.env.local` and set **`SOLD_COMPS_API_KEY`** from
[sold-comps.com](https://sold-comps.com/) (Dashboard → API key). Restart `pnpm dev`
after changing env vars.

eBay **sold** data is billed by SoldComps (free tier: **100 searches/month**; paid
plans for more). Identical searches are cached server-side for **6 hours** by default
(`SEARCH_CACHE_REVALIDATE_SECONDS`, set `0` to disable) so repeats do not burn quota.

## How a search flows

```
SearchForm (client)
  -> URL search params
    -> app/page.tsx (server)
      -> searchMarketplace / searchAllMarketplaces
        -> adapter registry
          -> one adapter per marketplace, in parallel
            -> computePriceStats
              -> results UI
```

Search state lives in the URL, so results are shareable and browser
back/forward works. Each marketplace streams into its own Suspense boundary,
and the promises are memoized per request with React `cache`, so a marketplace
is searched once even though the card and the comparison chart both read it.

An adapter that throws or exceeds the 15s live timeout (10s when mocked)
becomes one error card; the other three still render.

`GET /api/search?q=detroit+jacket&brand=Carhartt&days=90` returns the same data
as JSON.

## Adding a live adapter

Adapters are the only place that knows how a marketplace works. To replace one:

1. Open the marketplace's folder, for example
   [`src/lib/marketplaces/ebay/adapter.ts`](src/lib/marketplaces/ebay/adapter.ts).
2. Export a `MarketplaceAdapter` (see
   [`src/lib/marketplaces/types.ts`](src/lib/marketplaces/types.ts)) instead of
   calling `createMockAdapter`:

   ```ts
   export const ebayAdapter: MarketplaceAdapter = {
     id: "ebay",
     label: "eBay",
     dataSource: "live",
     buildSearchUrl: (query) => `https://www.ebay.com/sch/i.html?...`,
     async search(query, signal) {
       const response = await fetch(endpoint, { signal, headers });
       // Map the response into SoldListing[]: integer cents, ISO soldAt.
       return listings;
     },
   };
   ```

3. Set `dataSource: "live"` so the sample-data banner stops claiming that site
   is mocked.

Nothing else needs to change. [`src/lib/search-service.ts`](src/lib/search-service.ts)
validates whatever an adapter returns against
[`soldListingSchema`](src/lib/schema.ts), so a malformed response surfaces as an
error on that one card instead of breaking the page. Statistics, formatting, and
the UI all work off `SoldListing`.

Adding a fifth marketplace is the same work plus one entry in
[`src/lib/marketplaces/registry.ts`](src/lib/marketplaces/registry.ts) and one
`MarketplaceId` in `types.ts`.

## Deploying (GitHub + Vercel)

1. Push the repo to GitHub. Do **not** commit `.env.local` (it is gitignored).
2. Import the project in [Vercel](https://vercel.com/) and use **pnpm** as the
   package manager (Vercel detects `pnpm-lock.yaml`).
3. Set environment variables in the Vercel project (Production + Preview as needed):

   | Variable | Required | Notes |
   | -------- | -------- | ----- |
   | `SOLD_COMPS_API_KEY` | Yes (for live eBay) | From [sold-comps.com](https://sold-comps.com/) |
   | `SEARCH_CACHE_REVALIDATE_SECONDS` | No | Default 6h; `0` disables cache |
   | `USE_MOCK_MARKETPLACES` | No | Set to `1` for demo/staging without live scrapes |

4. Deploy. Server-side fetches (Poshmark, Vinted, Depop HTML, SoldComps) run on
   Vercel’s Node runtime; no extra config is required for a standard Next.js app.

**Quota:** SoldComps counts each uncached search. The built-in cache reduces
repeat lookups for the same query parameters within the revalidate window.
