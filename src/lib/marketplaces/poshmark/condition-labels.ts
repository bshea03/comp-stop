import { poshmarkConditionFromCode } from "@/lib/listings/condition-vocabulary";

/** Canonical condition string for a Poshmark post code (for listing `condition`). */
export function poshmarkConditionLabel(
  code: string | undefined,
): string | undefined {
  if (!code?.trim()) return undefined;
  const canonical = poshmarkConditionFromCode(code);
  if (canonical) return canonical;
  return code.trim();
}
