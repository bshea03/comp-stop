import { stripEnv } from "@/lib/env";
import {
  BrightDataFallbackError,
  fetchHtmlViaBrightDataUnlocker,
} from "@/lib/marketplaces/live/brightdata-unlocker";
import { buildDepopSearchUrl } from "@/lib/marketplaces/depop/external";
import {
  isDepopBlockedHtml,
  parseDepopSearchHtml,
} from "@/lib/marketplaces/depop/parse-search-html";
import type { SearchQuery, SoldListing } from "@/lib/marketplaces/types";

function depopBrightDataRenderEnabled(): boolean {
  const raw = stripEnv(process.env.BRIGHTDATA_RENDER);
  if (!raw) return true;
  const lower = raw.toLowerCase();
  if (lower === "0" || lower === "false" || lower === "no") return false;
  return true;
}

function depopFetchLimit(query: SearchQuery): number {
  const raw = process.env.DEPOP_MAX_LISTINGS?.trim();
  const cap = raw ? Number.parseInt(raw, 10) : 24;
  const resolved = Number.isFinite(cap) && cap > 0 ? cap : 24;
  return Math.min(query.limit, resolved);
}

export async function searchDepopViaBrightData(
  query: SearchQuery,
  signal: AbortSignal,
): Promise<SoldListing[]> {
  const url = buildDepopSearchUrl(query);
  const render = depopBrightDataRenderEnabled();
  let html = await fetchHtmlViaBrightDataUnlocker(url, signal, { render });

  if (isDepopBlockedHtml(html) && !render) {
    html = await fetchHtmlViaBrightDataUnlocker(url, signal, { render: true });
  }

  if (isDepopBlockedHtml(html)) {
    throw new BrightDataFallbackError(
      "Depop returned a blocked page via Bright Data.",
    );
  }

  return parseDepopSearchHtml(html, depopFetchLimit(query));
}
