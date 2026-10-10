import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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
  if (host.includes("depop.com") && !headers.has("Referer")) {
    headers.set("Referer", "https://www.depop.com/");
  }

  return fetch(url, { ...init, headers, signal, redirect: "follow" });
}

/**
 * Loads HTML for sites that block Node's fetch fingerprint (e.g. Depop /
 * Cloudflare). Falls back to the system `curl` binary, which uses a different
 * TLS stack and usually succeeds on the same machine.
 */
export async function fetchMarketplaceHtml(
  url: string,
  signal: AbortSignal,
): Promise<string> {
  const response = await marketplaceFetch(url, signal, {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });

  if (response.ok) {
    return response.text();
  }

  if (response.status === 403 || response.status === 401) {
    signal.throwIfAborted();
    return fetchHtmlViaCurl(url, signal);
  }

  throw new Error(`HTTP ${response.status} loading ${new URL(url).hostname}.`);
}

async function fetchHtmlViaCurl(
  url: string,
  signal: AbortSignal,
): Promise<string> {
  const curlBin = process.platform === "win32" ? "curl.exe" : "curl";

  try {
    const { stdout } = await execFileAsync(
      curlBin,
      [
        "-sS",
        "-L",
        "--max-time",
        "14",
        "-A",
        BROWSER_USER_AGENT,
        "-H",
        "Accept: text/html,application/xhtml+xml",
        "-H",
        "Accept-Language: en-US,en;q=0.9",
        url,
      ],
      {
        maxBuffer: 15 * 1024 * 1024,
        signal,
      },
    );

    const html = stdout.toString();
    if (html.length < 5_000 && /cloudflare|cf-browser-verification/i.test(html)) {
      throw new Error("blocked");
    }
    return html;
  } catch {
    throw new Error(
      "Depop blocked automated access from this server. Install curl or open Depop via the verify link.",
    );
  }
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
