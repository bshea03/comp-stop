import { EBAY_CONDITION_IDS } from "@/lib/marketplaces/ebay/condition-ids";
import { keywordString } from "@/lib/marketplaces/mock/create-mock-adapter";
import type { SearchQuery } from "@/lib/marketplaces/types";

function searchKeywords(query: SearchQuery): string {
  const combined = keywordString(query) || query.keywords.trim();
  return combined;
}

function baseParams(query: SearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set("_nkw", searchKeywords(query));
  // eBay's own sidebar filter links include rt=nc; omitting it can produce bad redirects.
  params.set("rt", "nc");

  if (query.condition) {
    const conditionId = EBAY_CONDITION_IDS[query.condition];
    if (conditionId) params.set("LH_ItemCondition", conditionId);
  }

  return params;
}

/** Active listings — works without an eBay account. */
export function buildEbayActiveSearchUrl(query: SearchQuery): string {
  return `https://www.ebay.com/sch/i.html?${baseParams(query).toString()}`;
}

/**
 * Sold comps search. eBay may prompt for a free account before showing results;
 * the return URL after sign-in is this same address.
 */
export function buildEbaySoldSearchUrl(query: SearchQuery): string {
  const params = baseParams(query);
  // Order matches eBay's "Completed" + "Sold" filters; both are required for sold-only comps.
  params.set("LH_Complete", "1");
  params.set("LH_Sold", "1");
  params.set("_sop", "13");
  return `https://www.ebay.com/sch/i.html?${params.toString()}`;
}
