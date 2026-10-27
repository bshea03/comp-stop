"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ResultsView } from "@/lib/results-view";

const ResultsViewContext = createContext<ResultsView | null>(null);

export function ResultsViewProvider({
  view,
  children,
}: {
  view: ResultsView;
  children: ReactNode;
}) {
  return (
    <ResultsViewContext.Provider value={view}>
      {children}
    </ResultsViewContext.Provider>
  );
}

export function useResultsView(): ResultsView {
  const view = useContext(ResultsViewContext);
  if (!view) {
    throw new Error("useResultsView must be used within ResultsViewProvider");
  }
  return view;
}
