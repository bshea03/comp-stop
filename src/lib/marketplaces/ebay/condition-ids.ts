import { CONDITION_USED_ONLY } from "@/lib/schema";

/** eBay `conditionId` / LH_ItemCondition values for US marketplace. */
export const EBAY_CONDITION_IDS: Record<string, string> = {
  "New with tags": "1000",
  "New without tags": "1500",
  Excellent: "3000",
  Good: "3000",
  Fair: "7000",
};

const EBAY_USED_CONDITION_IDS = [
  ...new Set([
    EBAY_CONDITION_IDS.Excellent,
    EBAY_CONDITION_IDS.Fair,
  ]),
];

export function ebayConditionIdsForFilter(
  condition: string | undefined,
): string[] {
  if (!condition) return [];
  if (condition === CONDITION_USED_ONLY) return [...EBAY_USED_CONDITION_IDS];
  const id = EBAY_CONDITION_IDS[condition];
  return id ? [id] : [];
}

/** Buy Browse `filter` segment for conditionIds, or undefined when unfiltered. */
export function ebayBrowseConditionFilter(
  condition: string | undefined,
): string | undefined {
  const ids = ebayConditionIdsForFilter(condition);
  if (ids.length === 0) return undefined;
  return `conditionIds:{${ids.join("|")}}`;
}
