import { stripEnv } from "@/lib/env";

/** Public search-only keys Grailed embeds in its frontend (rotate occasionally). */
const DEFAULT_GRAILED_ALGOLIA_APP_ID = "MNRWEFSS2Q";
const DEFAULT_GRAILED_ALGOLIA_API_KEY = "bc9ee1c014521ccf312525a4ef324a16";

export function grailedAlgoliaAppId(): string {
  return stripEnv(process.env.GRAILED_ALGOLIA_APP_ID) ?? DEFAULT_GRAILED_ALGOLIA_APP_ID;
}

export function grailedAlgoliaApiKey(): string {
  return (
    stripEnv(process.env.GRAILED_ALGOLIA_API_KEY) ??
    DEFAULT_GRAILED_ALGOLIA_API_KEY
  );
}

export function grailedAlgoliaMultiQueryUrl(appId: string): string {
  return `https://${appId.toLowerCase()}-1.algolianet.com/1/indexes/*/queries`;
}
