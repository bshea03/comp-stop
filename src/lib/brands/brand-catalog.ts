import { unstable_cache } from "next/cache";

import { dedupeClothingBrandNames } from "@/lib/brands/build-clothing-brands";
import { CLOTHING_BRAND_SOURCES } from "@/lib/brands/clothing-brands-data";
import { getCachedEbayClothingBrands } from "@/lib/brands/ebay-taxonomy-brands";

export type BrandCatalogMeta = {
  brands: readonly string[];
  sources: {
    ebay: number;
    static: number;
  };
};

async function buildBrandCatalog(): Promise<BrandCatalogMeta> {
  const ebay = await getCachedEbayClothingBrands();
  const merged = dedupeClothingBrandNames([
    ...ebay,
    ...CLOTHING_BRAND_SOURCES,
  ]);

  return {
    brands: merged,
    sources: {
      ebay: ebay.length,
      static: CLOTHING_BRAND_SOURCES.length,
    },
  };
}

export const getBrandCatalog = unstable_cache(
  buildBrandCatalog,
  ["brand-catalog-v2"],
  { revalidate: 604_800 },
);
