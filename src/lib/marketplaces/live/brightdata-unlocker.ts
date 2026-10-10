import { stripEnv } from "@/lib/env";

const UNLOCKER_URL = "https://api.brightdata.com/request";

export type BrightDataUnlockerFetchOptions = {
  /** Force browser rendering (slower; needed for some JS-heavy pages). */
  render?: boolean;
};

export function brightDataUnlockerConfigured(): boolean {
  return Boolean(
    stripEnv(process.env.BRIGHTDATA_API_KEY) &&
      stripEnv(process.env.BRIGHTDATA_UNLOCKER_ZONE),
  );
}

/** Use Bright Data Web Unlocker (1 credit per successful request). */
export async function fetchHtmlViaBrightDataUnlocker(
  targetUrl: string,
  signal: AbortSignal,
  options?: BrightDataUnlockerFetchOptions,
): Promise<string> {
  const apiKey = stripEnv(process.env.BRIGHTDATA_API_KEY);
  const zone = stripEnv(process.env.BRIGHTDATA_UNLOCKER_ZONE);
  if (!apiKey || !zone) {
    throw new BrightDataFallbackError(
      "Bright Data is not configured (missing API key or zone).",
    );
  }

  const country = stripEnv(process.env.BRIGHTDATA_COUNTRY) ?? "us";

  const payload: Record<string, string> = {
    zone,
    url: targetUrl,
    format: "raw",
    country,
  };
  if (options?.render) {
    payload.render = "true";
  }

  const response = await fetch(UNLOCKER_URL, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  const unlockerFailure = brightDataUnlockerFailureMessage(response, body);
  if (unlockerFailure) {
    throw new BrightDataFallbackError(unlockerFailure);
  }

  if (response.status === 401) {
    throw new BrightDataFallbackError(
      "Bright Data rejected the API key. Showing Depop link-out instead.",
    );
  }
  if (response.status === 402 || response.status === 429) {
    throw new BrightDataFallbackError(
      "Bright Data credits or rate limit reached. Showing Depop link-out instead.",
    );
  }
  if (response.status === 407) {
    throw new BrightDataFallbackError(
      "Bright Data zone credentials are invalid. Showing Depop link-out instead.",
    );
  }
  if (!response.ok) {
    throw new BrightDataFallbackError(
      `Bright Data HTTP ${response.status}. Showing Depop link-out instead.`,
    );
  }

  const html = unwrapBrightDataResponseBody(body);
  if (!html.trim()) {
    throw new BrightDataFallbackError(
      "Bright Data returned an empty page (Depop may be blocked for your account).",
    );
  }
  return html;
}

function brightDataUnlockerFailureMessage(
  response: Response,
  body: string,
): string | null {
  const errCode = response.headers.get("x-brd-err-code");
  const errMsg = response.headers.get("x-brd-err-msg");
  if (errCode || errMsg) {
    return formatBrightDataPlatformError(errCode, errMsg);
  }

  const trimmed = body.trimStart();
  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(body) as {
        status_code?: number;
        body?: string;
        headers?: Record<string, string>;
      };
      const headerBag = json.headers ?? {};
      const proxyStatus =
        headerBag["proxy-status"] ?? headerBag["Proxy-Status"] ?? "";
      const nestedCode =
        headerBag["x-brd-err-code"] ??
        (proxyStatus.includes("policy_20050") ? "policy_20050" : null);
      const nestedMsg = headerBag["x-brd-err-msg"];
      if (nestedCode || nestedMsg) {
        return formatBrightDataPlatformError(nestedCode, nestedMsg);
      }
      if (json.status_code && json.status_code >= 400) {
        return `Bright Data could not fetch the page (target HTTP ${json.status_code}).`;
      }
      if (json.status_code === 200 && !(json.body ?? "").trim()) {
        return "Bright Data returned an empty page.";
      }
    } catch {
      // not JSON envelope
    }
  }

  const targetStatus = response.headers.get("x-brd-status-code");
  if (targetStatus && targetStatus !== "200" && !body.trim()) {
    return `Bright Data could not fetch the page (target HTTP ${targetStatus}).`;
  }

  return null;
}

function formatBrightDataPlatformError(
  code: string | null,
  message: string | null,
): string {
  if (code === "policy_20050") {
    return (
      "Bright Data Depop access requires business KYC (policy_20050). " +
      "Personal accounts usually cannot enable it; use Depop link-out instead."
    );
  }
  if (message?.trim()) {
    return message.trim().slice(0, 420);
  }
  if (code) {
    return `Bright Data error (${code}).`;
  }
  return "Bright Data could not fetch the page.";
}

/** Some accounts return JSON even with `format: "raw"`. */
function unwrapBrightDataResponseBody(body: string): string {
  const trimmed = body.trimStart();
  if (!trimmed.startsWith("{")) return body;

  try {
    const json = JSON.parse(body) as {
      status_code?: number;
      body?: string;
      html?: string;
      content?: string;
      response?: string;
    };
    for (const field of [
      json.body,
      json.html,
      json.content,
      json.response,
    ]) {
      if (typeof field === "string" && field.length > 0) return field;
    }
    if (json.status_code && json.status_code >= 400) return "";
  } catch {
    // use raw body
  }

  return body;
}

/** Signals the Depop panel should use link-out UI instead of an error card. */
export class BrightDataFallbackError extends Error {
  override name = "BrightDataFallbackError";
}
