import { stripEnv } from "@/lib/env";

export const MERCARI_LINK_OUT_MESSAGE =
  "Mercari sold search runs in the browser (Cloudflare blocks server requests). Use the link below to open Mercari with sold listings for the same keywords.";

/** Skip live API attempts; show the Mercari link-out card. Default on. */
export function mercariLinkOutOnly(): boolean {
  const linkOut = stripEnv(process.env.MERCARI_LINK_OUT);
  if (linkOut === "0" || linkOut?.toLowerCase() === "false") return false;
  if (linkOut === "1" || linkOut?.toLowerCase() === "true") return true;
  return true;
}
