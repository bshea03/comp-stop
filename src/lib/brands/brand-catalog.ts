import { unstable_cache } from "next/cache";

import { dedupeClothingBrandNames } from "@/lib/brands/build-clothing-brands";
import { CLOTHING_BRAND_SOURCES } from "@/lib/brands/clothing-brands-data";
import { getCachedEbayClothingBrands } from "@/lib/brands/ebay-taxonomy-brands";

export type BrandCatalogResponse = {
  brands: readonly string[];
};

async function buildBrandCatalog(): Promise<BrandCatalogResponse> {
  const ebay = await getCachedEbayClothingBrands();
  const brands = dedupeClothingBrandNames([
    ...ebay,
    ...CLOTHING_BRAND_SOURCES,
  ]);

  return { brands };
}

export const getBrandCatalog = unstable_cache(
  buildBrandCatalog,
  ["brand-catalog-v2"],
  { revalidate: 604_800 },
);
