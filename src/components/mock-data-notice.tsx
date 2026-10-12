import type { MarketplaceResult } from "@/lib/marketplaces/types";

/** Shown when any marketplace still uses mock data. */
export function MockDataNotice({ results }: { results: MarketplaceResult[] }) {
  const mocked = results.filter((result) => result.dataSource === "mock");
  if (mocked.length === 0) return null;

  const mockNames = mocked.map((result) => result.label);
  const mockList =
    mockNames.length === 1
      ? mockNames[0]
      : `${mockNames.slice(0, -1).join(", ")} and ${mockNames[mockNames.length - 1]}`;

  return (
    <div
      role="status"
      className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
    >
      <p>
        <span className="font-semibold">Sample data.</span>{" "}
        {`${mockList} ${mockNames.length === 1 ? "is" : "are"} using the mock adapter. Remove USE_MOCK_MARKETPLACES=1 for live data and add eBay keys in .env.local for eBay.`}
      </p>
    </div>
  );
}
