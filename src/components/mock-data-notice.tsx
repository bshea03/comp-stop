import type { MarketplaceResult } from "@/lib/marketplaces/types";

/**
 * Shown when any marketplace still uses mock data, or when live data is active
 * listings rather than sold comps.
 */
export function MockDataNotice({ results }: { results: MarketplaceResult[] }) {
  const mocked = results.filter((result) => result.dataSource === "mock");
  const activeLive = results.filter(
    (result) => result.dataSource === "live" && result.listingKind === "active",
  );

  if (mocked.length === 0 && activeLive.length === 0) return null;

  const mockNames = mocked.map((result) => result.label);
  const mockList =
    mockNames.length === 0
      ? null
      : mockNames.length === 1
        ? mockNames[0]
        : `${mockNames.slice(0, -1).join(", ")} and ${mockNames[mockNames.length - 1]}`;

  const activeNames = activeLive.map((result) => result.label);
  const activeList =
    activeNames.length === 0
      ? null
      : activeNames.length === 1
        ? activeNames[0]
        : `${activeNames.slice(0, -1).join(", ")} and ${activeNames[activeNames.length - 1]}`;

  return (
    <div
      role="status"
      className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning space-y-2"
    >
      {mockList ? (
        <p>
          <span className="font-semibold">Sample data.</span>{" "}
          {`${mockList} ${mockNames.length === 1 ? "is" : "are"} using the mock adapter. Remove USE_MOCK_MARKETPLACES=1 for live data and add eBay keys in .env.local for eBay.`}
        </p>
      ) : null}
      {activeList ? (
        <p>
          <span className="font-semibold">Active listings.</span>{" "}
          {`${activeList} ${activeNames.length === 1 ? "shows" : "show"} asking prices, not confirmed sold comps. Poshmark sold data is live when available.`}
        </p>
      ) : null}
    </div>
  );
}
