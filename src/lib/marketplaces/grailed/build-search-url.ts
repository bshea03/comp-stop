import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import type { SearchQuery } from "@/lib/marketplaces/types";

export function buildGrailedSoldSearchUrl(query: SearchQuery): string {
  const params = new URLSearchParams({ query: keywordString(query) });
  return `https://www.grailed.com/shop?${params.toString()}`;
}
