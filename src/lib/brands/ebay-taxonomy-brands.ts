import { unstable_cache } from "next/cache";

import { dedupeClothingBrandNames } from "@/lib/brands/build-clothing-brands";
import {
  ebayApiOrigin,
  ebayMarketplaceId,
  fetchEbayApplicationToken,
} from "@/lib/marketplaces/ebay/application-token";

const TAXONOMY_OAUTH_SCOPE =
  "https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/commerce.taxonomy.readonly";

/** Leaf apparel categories on EBAY_US (tree id 0). */
const EBAY_APPAREL_LEAF_CATEGORY_IDS = [
  "63862", // Women's Tops & Blouses
  "11554", // Women's Jeans
  "53557", // Women's Dresses
  "57991", // Men's Shirts
  "57990", // Men's Jeans
  "15689", // Men's Activewear
  "11483", // Men's Sweaters
] as const;

type EbayAspectValue = { localizedValue?: string };
type EbayAspect = {
  localizedAspectName?: string;
  aspectValues?: EbayAspectValue[];
};

async function fetchBrandValuesForCategory(
  categoryTreeId: string,
  categoryId: string,
  token: string,
  signal: AbortSignal,
): Promise<string[]> {
  const url = `${ebayApiOrigin()}/commerce/taxonomy/v1/category_tree/${categoryTreeId}/get_item_aspects_for_category?category_id=${categoryId}`;

  const response = await fetch(url, {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const body = (await response.json()) as { aspects?: EbayAspect[] };
  const brandAspect = body.aspects?.find(
    (aspect) => aspect.localizedAspectName?.toLowerCase() === "brand",
  );

  return (brandAspect?.aspectValues ?? [])
    .map((value) => value.localizedValue?.trim())
    .filter((name): name is string => Boolean(name && name !== "Unbranded"));
}

async function fetchEbayClothingBrandsUncached(): Promise<string[]> {
  const signal = AbortSignal.timeout(25_000);
  const token = await fetchEbayApplicationToken(
    TAXONOMY_OAUTH_SCOPE,
    signal,
    "eBay developer credentials are not configured.",
  );

  const marketplaceId = ebayMarketplaceId();
  const treeResponse = await fetch(
    `${ebayApiOrigin()}/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${encodeURIComponent(marketplaceId)}`,
    {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );

  if (!treeResponse.ok) {
    throw new Error(`eBay category tree HTTP ${treeResponse.status}.`);
  }

  const treeBody = (await treeResponse.json()) as {
    categoryTreeId?: string;
  };
  const categoryTreeId = treeBody.categoryTreeId ?? "0";

  const batches = await Promise.all(
    EBAY_APPAREL_LEAF_CATEGORY_IDS.map((categoryId) =>
      fetchBrandValuesForCategory(categoryTreeId, categoryId, token, signal),
    ),
  );

  return dedupeClothingBrandNames(batches.flat());
}

async function fetchEbayClothingBrands(): Promise<string[]> {
  try {
    return await fetchEbayClothingBrandsUncached();
  } catch {
    return [];
  }
}

/** Cached eBay apparel brand directory (7 days). Empty when credentials or API fail. */
export const getCachedEbayClothingBrands = unstable_cache(
  fetchEbayClothingBrands,
  ["ebay-clothing-brands-v1"],
  { revalidate: 604_800 },
);
