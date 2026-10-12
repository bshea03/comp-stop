import type { CanonicalCondition } from "@/lib/listings/condition-match";

/** Poshmark filter codes when the vm-rest API supports them for the query. */
export const POSHMARK_CONDITION_FILTER: Partial<
  Record<CanonicalCondition, string[]>
> = {
  "New with tags": ["nwt"],
  "New without tags": ["nwot"],
  Excellent: ["uln"],
  Good: ["ug"],
  Fair: ["uf"],
};
