export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Fetch HTML or JSON from a marketplace with a browser-like user agent. */
export async function marketplaceFetch(
  url: string,
  signal: AbortSignal,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", BROWSER_USER_AGENT);
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "*/*");
  }
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", "en-US,en;q=0.9");
  }

  const host = new URL(url).hostname;
  if (!headers.has("Referer")) {
    headers.set("Referer", `https://${host}/`);
  }

  return fetch(url, { ...init, headers, signal, redirect: "follow" });
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
