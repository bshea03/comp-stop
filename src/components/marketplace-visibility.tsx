"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  countEnabledMarketplaces,
  defaultMarketplaceVisibility,
  enabledPanelSearchIds,
  isMarketplaceEnabled,
  MARKETPLACE_VISIBILITY_STORAGE_KEY,
  parseMarketplaceVisibility,
  serializeMarketplaceVisibility,
  writeMarketplaceVisibilityCookie,
  type MarketplaceVisibility,
} from "@/lib/marketplace-visibility";
import type { MarketplaceId, PanelSearchId } from "@/lib/marketplaces/types";

type MarketplaceVisibilityContextValue = {
  visibility: MarketplaceVisibility;
  hydrated: boolean;
  isEnabled: (id: MarketplaceId) => boolean;
  setEnabled: (id: MarketplaceId, enabled: boolean) => void;
  toggle: (id: MarketplaceId) => void;
  enableAll: () => void;
  enabledCount: number;
  enabledPanelSearchIds: readonly PanelSearchId[];
};

const MarketplaceVisibilityContext =
  createContext<MarketplaceVisibilityContextValue | null>(null);

export function MarketplaceVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(defaultMarketplaceVisibility);
  const [hydrated, setHydrated] = useState(false);

  const persistVisibility = useCallback(
    (next: MarketplaceVisibility, refreshServer: boolean) => {
      localStorage.setItem(
        MARKETPLACE_VISIBILITY_STORAGE_KEY,
        serializeMarketplaceVisibility(next),
      );
      writeMarketplaceVisibilityCookie(next);
      if (refreshServer) {
        router.refresh();
      }
    },
    [router],
  );

  useEffect(() => {
    const stored = parseMarketplaceVisibility(
      localStorage.getItem(MARKETPLACE_VISIBILITY_STORAGE_KEY),
    );
    queueMicrotask(() => {
      setVisibility(stored);
      writeMarketplaceVisibilityCookie(stored);
      setHydrated(true);
    });
  }, []);

  const isEnabled = useCallback(
    (id: MarketplaceId) => isMarketplaceEnabled(visibility, id),
    [visibility],
  );

  const setEnabled = useCallback(
    (id: MarketplaceId, enabled: boolean) => {
      setVisibility((prev) => {
        if (prev[id] === enabled) return prev;
        const next = { ...prev, [id]: enabled };
        persistVisibility(next, hydrated);
        return next;
      });
    },
    [hydrated, persistVisibility],
  );

  const toggle = useCallback(
    (id: MarketplaceId) => {
      setVisibility((prev) => {
        const next = {
          ...prev,
          [id]: !isMarketplaceEnabled(prev, id),
        };
        persistVisibility(next, hydrated);
        return next;
      });
    },
    [hydrated, persistVisibility],
  );

  const enableAll = useCallback(() => {
    const next = defaultMarketplaceVisibility();
    setVisibility(next);
    persistVisibility(next, hydrated);
  }, [hydrated, persistVisibility]);

  const panelSearchIds = useMemo(
    () => enabledPanelSearchIds(visibility),
    [visibility],
  );

  const enabledCount = useMemo(
    () => countEnabledMarketplaces(visibility),
    [visibility],
  );

  const value = useMemo(
    (): MarketplaceVisibilityContextValue => ({
      visibility,
      hydrated,
      isEnabled,
      setEnabled,
      toggle,
      enableAll,
      enabledCount,
      enabledPanelSearchIds: panelSearchIds,
    }),
    [
      visibility,
      hydrated,
      isEnabled,
      setEnabled,
      toggle,
      enableAll,
      enabledCount,
      panelSearchIds,
    ],
  );

  return (
    <MarketplaceVisibilityContext.Provider value={value}>
      {children}
    </MarketplaceVisibilityContext.Provider>
  );
}

export function useMarketplaceVisibility(): MarketplaceVisibilityContextValue {
  const value = useContext(MarketplaceVisibilityContext);
  if (!value) {
    throw new Error(
      "useMarketplaceVisibility must be used within MarketplaceVisibilityProvider",
    );
  }
  return value;
}

/** Hides server-rendered panel children when the shop is toggled off. */
export function MarketplacePanelGate({
  marketplaceId,
  children,
}: {
  marketplaceId: MarketplaceId;
  children: ReactNode;
}) {
  const { hydrated, isEnabled } = useMarketplaceVisibility();

  if (!hydrated) return children;
  if (!isEnabled(marketplaceId)) return null;
  return children;
}
