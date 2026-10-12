"use client";

import { useSearchParams } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type TransitionStartFunction,
} from "react";

import {
  buildSearchParams,
  DEFAULT_DAYS_BACK,
  SEARCH_PARAM_KEYS,
} from "@/lib/schema";
import { PANEL_SEARCH_IDS } from "@/lib/marketplaces/marketplace-panels";
import type { PanelSearchId } from "@/lib/marketplaces/types";

type SearchStateContextValue = {
  isSearching: boolean;
  isPendingNavigation: boolean;
  startTransition: TransitionStartFunction;
  beginSearch: () => void;
  generation: number;
  markMarketplaceComplete: (
    searchId: PanelSearchId,
    generation: number,
  ) => void;
};

const SearchStateContext = createContext<SearchStateContextValue | null>(null);

function searchKeyFromParams(params: URLSearchParams): string | null {
  const keywords = params.get(SEARCH_PARAM_KEYS.keywords)?.trim();
  if (!keywords) return null;

  return buildSearchParams({
    keywords,
    brand: params.get(SEARCH_PARAM_KEYS.brand)?.trim() || undefined,
    condition: (params.get(SEARCH_PARAM_KEYS.condition)?.trim() ||
      undefined) as Parameters<typeof buildSearchParams>[0]["condition"],
    daysBack: Number(params.get(SEARCH_PARAM_KEYS.daysBack) ?? DEFAULT_DAYS_BACK),
  });
}

function SearchKeyFromUrl({
  onSearchKeyChange,
}: {
  onSearchKeyChange: (searchKey: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const searchKey = useMemo(
    () => searchKeyFromParams(searchParams),
    [searchParams],
  );

  useEffect(() => {
    queueMicrotask(() => onSearchKeyChange(searchKey));
  }, [searchKey, onSearchKeyChange]);

  return null;
}

export function SearchStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [generation, setGeneration] = useState(0);
  const [incomplete, setIncomplete] = useState<Set<PanelSearchId>>(new Set());
  const generationRef = useRef(0);

  const resetMarketplaceLoads = useCallback(() => {
    generationRef.current += 1;
    setGeneration(generationRef.current);
    setIncomplete(new Set(PANEL_SEARCH_IDS));
  }, []);

  const onSearchKeyChange = useCallback(
    (searchKey: string | null) => {
      if (!searchKey) {
        setIncomplete(new Set());
        return;
      }
      resetMarketplaceLoads();
    },
    [resetMarketplaceLoads],
  );

  const markMarketplaceComplete = useCallback(
    (searchId: PanelSearchId, forGeneration: number) => {
      if (forGeneration !== generationRef.current) return;
      setIncomplete((prev) => {
        if (!prev.has(searchId)) return prev;
        const next = new Set(prev);
        next.delete(searchId);
        return next;
      });
    },
    [],
  );

  const isSearching = isPending || incomplete.size > 0;

  return (
    <SearchStateContext.Provider
      value={{
        isSearching,
        isPendingNavigation: isPending,
        startTransition,
        beginSearch: resetMarketplaceLoads,
        generation,
        markMarketplaceComplete,
      }}
    >
      <Suspense fallback={null}>
        <SearchKeyFromUrl onSearchKeyChange={onSearchKeyChange} />
      </Suspense>
      {children}
    </SearchStateContext.Provider>
  );
}

export function useSearchState(): SearchStateContextValue {
  const value = useContext(SearchStateContext);
  if (!value) {
    throw new Error("useSearchState must be used within SearchStateProvider");
  }
  return value;
}

export function MarketplaceLoadTracker({
  searchId,
  children,
}: {
  searchId: PanelSearchId;
  children: React.ReactNode;
}) {
  const { generation, markMarketplaceComplete } = useSearchState();

  useEffect(() => {
    markMarketplaceComplete(searchId, generation);
  }, [searchId, generation, markMarketplaceComplete]);

  return children;
}
