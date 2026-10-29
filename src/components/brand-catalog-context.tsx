"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CLOTHING_BRANDS } from "@/lib/brands/clothing-brands";

type BrandCatalogContextValue = {
  brands: readonly string[];
  loaded: boolean;
  ebayCount: number;
};

const BrandCatalogContext = createContext<BrandCatalogContextValue>({
  brands: CLOTHING_BRANDS,
  loaded: false,
  ebayCount: 0,
});

export function BrandCatalogProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<readonly string[]>(CLOTHING_BRANDS);
  const [loaded, setLoaded] = useState(false);
  const [ebayCount, setEbayCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/brands/catalog", {
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) return;
        const body = (await response.json()) as {
          brands?: string[];
          sources?: { ebay?: number };
        };
        if (cancelled || !Array.isArray(body.brands) || body.brands.length === 0) {
          return;
        }
        setBrands(body.brands);
        setEbayCount(body.sources?.ebay ?? 0);
      } catch {
        // Bundled list remains the fallback.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ brands, loaded, ebayCount }),
    [brands, loaded, ebayCount],
  );

  return (
    <BrandCatalogContext.Provider value={value}>
      {children}
    </BrandCatalogContext.Provider>
  );
}

export function useBrandCatalog(): BrandCatalogContextValue {
  return useContext(BrandCatalogContext);
}
