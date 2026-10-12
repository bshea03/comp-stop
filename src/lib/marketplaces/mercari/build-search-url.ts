import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import type { SearchQuery } from "@/lib/marketplaces/types";

export function buildMercariSoldSearchUrl(query: SearchQuery): string {
  const params = new URLSearchParams({
    keyword: keywordString(query),
    status: "sold_out",
  });
  return `https://www.mercari.com/search/?${params.toString()}`;
}
