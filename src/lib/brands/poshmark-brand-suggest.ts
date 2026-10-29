import { marketplaceFetch } from "@/lib/marketplaces/live/http";

type PoshmarkSuggestedEntry = {
  type?: string;
  brand?: string;
};

type PoshmarkSuggestedResponse = {
  data?: PoshmarkSuggestedEntry[];
};

/** Live brand names from Poshmark search autocomplete (no auth). */
export async function fetchPoshmarkBrandSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://poshmark.com/vm-rest/searches/suggested?query=${encodeURIComponent(trimmed)}`;
  const response = await marketplaceFetch(url, signal, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Poshmark brand suggest HTTP ${response.status}.`);
  }

  const body = (await response.json()) as PoshmarkSuggestedResponse;
  const names: string[] = [];

  for (const entry of body.data ?? []) {
    if (entry.type !== "brand") continue;
    const name = entry.brand?.trim();
    if (name) names.push(name);
  }

  return names;
}
