import { normalizeBrandName } from "@/lib/listings/brand-match";

/** Pick the nicer display string when two names normalize the same. */
function preferCanonical(existing: string, candidate: string): string {
  if (candidate.length > existing.length) return candidate;
  if (candidate.length < existing.length) return existing;
  const existingHasCase = /[A-Z]/.test(existing);
  const candidateHasCase = /[A-Z]/.test(candidate);
  if (candidateHasCase && !existingHasCase) return candidate;
  return existing;
}

export function dedupeClothingBrandNames(names: readonly string[]): string[] {
  const byKey = new Map<string, string>();

  for (const raw of names) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const key = normalizeBrandName(name);
    if (!key) continue;

    const existing = byKey.get(key);
    byKey.set(key, existing ? preferCanonical(existing, name) : name);
  }

  return [...byKey.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
