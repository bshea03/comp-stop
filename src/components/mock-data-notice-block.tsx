import { MockDataNotice } from "@/components/mock-data-notice";
import { enabledPanelSearchIds } from "@/lib/marketplace-visibility";
import { getMarketplaceVisibilityFromRequest } from "@/lib/marketplace-visibility-server";
import type { SearchQuery } from "@/lib/marketplaces/types";
import { searchAllMarketplaces } from "@/lib/search-service";

export async function MockDataNoticeBlock({ query }: { query: SearchQuery }) {
  const visibility = await getMarketplaceVisibilityFromRequest();
  const results = await searchAllMarketplaces(
    query,
    enabledPanelSearchIds(visibility),
  );
  return <MockDataNotice results={results} />;
}
