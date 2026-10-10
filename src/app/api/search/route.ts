import type { NextRequest } from "next/server";

import { parseSearchParams, SEARCH_PARAM_KEYS } from "@/lib/schema";
import { searchAllMarketplaces } from "@/lib/search-service";
import { computeBlendedStats } from "@/lib/stats";

export async function GET(request: NextRequest) {
  const query = parseSearchParams(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  if (!query) {
    return Response.json(
      { error: `Missing required "${SEARCH_PARAM_KEYS.keywords}" parameter.` },
      { status: 400 },
    );
  }

  const results = await searchAllMarketplaces(query);

  return Response.json({
    query,
    blended: computeBlendedStats(results.map((result) => result.listings)),
    results,
  });
}
