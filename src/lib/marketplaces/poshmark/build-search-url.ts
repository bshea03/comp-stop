import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import type { SearchQuery } from "@/lib/marketplaces/types";

export function buildPoshmarkSoldSearchUrl(query: SearchQuery): string {
  const params = new URLSearchParams({
    query: keywordString(query),
    availability: "sold_out",
  });
  return `https://poshmark.com/search?${params.toString()}`;
}

export function buildPoshmarkActiveSearchUrl(query: SearchQuery): string {
  const params = new URLSearchParams({
    query: keywordString(query),
    availability: "available",
  });
  return `https://poshmark.com/search?${params.toString()}`;
}
