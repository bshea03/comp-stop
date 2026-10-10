import { stripEnv } from "@/lib/env";

/** Shown on the Depop card when we link out instead of in-app listings. */
export const DEPO_LINK_OUT_MESSAGE =
  "Depop has no public sold-search API and blocks most scraping, so CompStop opens Depop with the same keywords.";

/** Dev-only note when Bright Data keys are set but Depop is not approved on the account. */
export const DEPO_BRIGHTDATA_KYC_DEV_NOTE =
  "Bright Data only unlocks Depop after business KYC (not practical for most personal accounts). Set DEPO_LINK_OUT=1 and remove BRIGHTDATA_* from .env.local to skip unlocker calls.";

let brightDataDepopBlocked = false;

/** After policy_20050 (or similar), skip further unlocker requests this process. */
export function markBrightDataDepopUnavailable(): void {
  brightDataDepopBlocked = true;
}

export function brightDataDepopSkipped(): boolean {
  return brightDataDepopBlocked;
}

/** Personal / default: never call Bright Data; use the Depop link-out panel. */
export function depopLinkOutOnly(): boolean {
  const linkOut = stripEnv(process.env.DEPO_LINK_OUT);
  if (linkOut === "1" || linkOut?.toLowerCase() === "true") return true;
  const live = stripEnv(process.env.DEPO_LIVE);
  if (live === "0" || live?.toLowerCase() === "false") return true;
  return false;
}
