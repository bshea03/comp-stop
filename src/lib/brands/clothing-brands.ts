import { dedupeClothingBrandNames } from "@/lib/brands/build-clothing-brands";
import { CLOTHING_BRAND_SOURCES } from "@/lib/brands/clothing-brands-data";

/** Sorted, deduplicated clothing brands across CompStop marketplaces. */
export const CLOTHING_BRANDS: readonly string[] =
  dedupeClothingBrandNames(CLOTHING_BRAND_SOURCES);
