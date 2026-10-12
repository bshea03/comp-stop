/** Poshmark `post.condition` codes from vm-rest (not display labels). */
export const POSHMARK_CONDITION_LABELS: Record<string, string> = {
  nwt: "New with tags",
  nwot: "New without tags",
  uln: "Used like new",
  ug: "Good",
  uf: "Fair",
  ret: "Retail",
  wlsl: "Wholesale",
};

export function poshmarkConditionLabel(code: string | undefined): string | undefined {
  if (!code?.trim()) return undefined;
  const key = code.trim().toLowerCase();
  return POSHMARK_CONDITION_LABELS[key] ?? code;
}
