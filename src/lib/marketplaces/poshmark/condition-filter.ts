import type { CanonicalCondition } from "@/lib/listings/condition-match";
import { CONDITION_USED_ONLY } from "@/lib/schema";

/** Poshmark filter codes when the vm-rest API supports them for the query. */
export const POSHMARK_CONDITION_FILTER: Partial<
  Record<CanonicalCondition | typeof CONDITION_USED_ONLY, string[]>
> = {
  [CONDITION_USED_ONLY]: ["uln", "ug", "uf"],
  "New with tags": ["nwt"],
  "New without tags": ["nwot"],
  Excellent: ["uln"],
  Good: ["ug"],
  Fair: ["uf"],
};
