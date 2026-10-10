/** Trim and de-quote values from `.env` / Vercel environment variables. */
export function stripEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^['"]|['"]$/g, "");
}
