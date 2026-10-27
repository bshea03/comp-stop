import { cookies } from "next/headers";

import {
  MARKETPLACE_VISIBILITY_COOKIE_NAME,
  parseMarketplaceVisibilityCookie,
  type MarketplaceVisibility,
} from "@/lib/marketplace-visibility";

export async function getMarketplaceVisibilityFromRequest(): Promise<MarketplaceVisibility> {
  const store = await cookies();
  return parseMarketplaceVisibilityCookie(
    store.get(MARKETPLACE_VISIBILITY_COOKIE_NAME)?.value,
  );
}
