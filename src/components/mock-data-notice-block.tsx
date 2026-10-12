import { MockDataNotice } from "@/components/mock-data-notice";
import { searchAllMarketplaces } from "@/lib/search-service";
import type { SearchQuery } from "@/lib/marketplaces/types";

export async function MockDataNoticeBlock({ query }: { query: SearchQuery }) {
  const results = await searchAllMarketplaces(query);
  return <MockDataNotice results={results} />;
}
