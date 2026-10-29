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
};

const BrandCatalogContext = createContext<BrandCatalogContextValue>({
  brands: CLOTHING_BRANDS,
});

export function BrandCatalogProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<readonly string[]>(CLOTHING_BRANDS);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/brands/catalog", {
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) return;
        const body = (await response.json()) as { brands?: string[] };
        if (cancelled || !Array.isArray(body.brands) || body.brands.length === 0) {
          return;
        }
        setBrands(body.brands);
      } catch {
        // Bundled list remains the fallback.
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ brands }), [brands]);

  return (
    <BrandCatalogContext.Provider value={value}>
      {children}
    </BrandCatalogContext.Provider>
  );
}

export function useBrandCatalog(): BrandCatalogContextValue {
  return useContext(BrandCatalogContext);
}
