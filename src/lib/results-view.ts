import type { ListingKind } from "@/lib/marketplaces/types";

import type { RawSearchParams } from "@/lib/schema";

export const RESULTS_VIEW_PARAM = "view";

export const RESULTS_VIEWS = ["sold", "active"] as const;
export type ResultsView = (typeof RESULTS_VIEWS)[number];

export const DEFAULT_RESULTS_VIEW: ResultsView = "sold";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseResultsView(params: RawSearchParams): ResultsView {
  const raw = firstValue(params[RESULTS_VIEW_PARAM])?.trim().toLowerCase();
  return raw === "active" ? "active" : "sold";
}

export function resultsViewToListingKind(view: ResultsView): ListingKind {
  return view;
}

/** Keeps `view=active` when submitting a new search from the form. */
export function preserveResultsViewOnParams(
  params: URLSearchParams,
  current: URLSearchParams,
): void {
  if (current.get(RESULTS_VIEW_PARAM) === "active") {
    params.set(RESULTS_VIEW_PARAM, "active");
  }
}
