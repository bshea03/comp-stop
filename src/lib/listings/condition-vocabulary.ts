import { CONDITION_USED_ONLY, CONDITIONS } from "@/lib/schema";

export type CanonicalCondition = (typeof CONDITIONS)[number];

export const USED_CANONICAL_CONDITIONS = [
  "Excellent",
  "Good",
  "Fair",
] as const satisfies readonly CanonicalCondition[];

export const CANONICAL_CONDITION_DISPLAY: Record<CanonicalCondition, string> =
  {
    "New with tags": "New - With Tags",
    "New without tags": "New - Without Tags",
    Excellent: "Used - Like New",
    Good: "Used - Good",
    Fair: "Used - Fair",
  };

/** Poshmark vm-rest `post.condition` codes → canonical buckets. */
export const POSHMARK_CODE_TO_CANONICAL: Partial<
  Record<string, CanonicalCondition>
> = {
  nwt: "New with tags",
  nwot: "New without tags",
  uln: "Excellent",
  ug: "Good",
  uf: "Fair",
};

export type ConditionSearchSelectItem =
  | { kind: "option"; value: string; label: string }
  | { kind: "divider" };

export const CONDITION_SEARCH_SELECT_ITEMS: readonly ConditionSearchSelectItem[] =
  [
    { kind: "option", value: "", label: "Any" },
    { kind: "option", value: CONDITION_USED_ONLY, label: "Used only" },
    { kind: "divider" },
    ...CONDITIONS.map((condition) => ({
      kind: "option" as const,
      value: condition,
      label: condition,
    })),
  ];

export function conditionFilterLabel(condition: string): string {
  if (condition === CONDITION_USED_ONLY) return "Used only";
  const canonical = condition as CanonicalCondition;
  if ((CONDITIONS as readonly string[]).includes(canonical)) {
    return CANONICAL_CONDITION_DISPLAY[canonical];
  }
  return condition;
}

export function usedOnlyGradeDisplayLabels(): string[] {
  return USED_CANONICAL_CONDITIONS.map(
    (grade) => CANONICAL_CONDITION_DISPLAY[grade],
  );
}

export function poshmarkConditionFromCode(
  code: string | undefined,
): CanonicalCondition | undefined {
  if (!code?.trim()) return undefined;
  return POSHMARK_CODE_TO_CANONICAL[code.trim().toLowerCase()];
}
