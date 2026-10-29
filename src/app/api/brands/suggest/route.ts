import type { NextRequest } from "next/server";

import { getBrandCatalog } from "@/lib/brands/brand-catalog";
import { fetchPoshmarkBrandSuggestions } from "@/lib/brands/poshmark-brand-suggest";
import {
  mergeBrandSuggestions,
  suggestBrandsFromList,
} from "@/lib/brands/suggest-clothing-brands";

const SUGGEST_LIMIT = 12;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 1) {
    return Response.json({ brands: [] as string[] });
  }

  const catalog = await getBrandCatalog();

  const [poshmark, fromCatalog] = await Promise.all([
    fetchPoshmarkBrandSuggestions(query, AbortSignal.timeout(8_000)).catch(
      () => [] as string[],
    ),
    Promise.resolve(
      suggestBrandsFromList(catalog.brands, query, SUGGEST_LIMIT),
    ),
  ]);

  const brands = mergeBrandSuggestions(
    [poshmark, fromCatalog],
    SUGGEST_LIMIT,
  );

  return Response.json({ brands });
}
