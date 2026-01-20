import * as cheerio from "cheerio";
import { httpGetText } from "../../core/http.ts";
import { withRetry } from "../../core/retry.ts";

export type DiscoveredFile = {
  chain: "shufersal";
  file_url: string;
  filename: string;
  store_id: string | null;
};

function decodeHtmlEntities(s: string) {
  // חשוב: &amp; => &
  return s.replace(/&amp;/g, "&");
}

function extractFilenameFromUrl(url: string): string {
  const noQuery = url.split("?")[0] ?? url;
  const parts = noQuery.split("/");
  return parts[parts.length - 1] ?? noQuery;
}

function isPriceFullGz(filename: string) {
  const f = filename.toLowerCase();
  return f.endsWith(".gz") && f.startsWith("pricefull") && !f.includes("promo");
}

function extractStoreIdFromFilename(filename: string): string | null {
  const m = filename.match(/PriceFull\d+-([0-9]{1,4})-\d{8,14}\.gz/i);
  return m?.[1] ?? null;
}

function shouldRetryHttp(err: unknown) {
  const msg = String((err as any)?.message ?? err);
  return (
    /timeout/i.test(msg) ||
    /HTTP 5\d\d/i.test(msg) ||
    /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND/i.test(msg)
  );
}

export async function discoverShufersalPriceFullFiles(): Promise<DiscoveredFile[]> {
  const maxPages = Number(process.env.SHUFERSAL_MAX_PAGES ?? 10);
  const maxFiles = Number(process.env.SHUFERSAL_MAX_FILES ?? 200);

  const pageTimeoutMs = Number(process.env.SHUFERSAL_PAGE_TIMEOUT_MS ?? 60_000);
  const retries = Number(process.env.SHUFERSAL_DISCOVER_RETRIES ?? 4);
  const baseDelayMs = Number(process.env.SHUFERSAL_DISCOVER_BASE_DELAY_MS ?? 500);
  const maxDelayMs = Number(process.env.SHUFERSAL_DISCOVER_MAX_DELAY_MS ?? 8_000);

  const failFast = (process.env.SHUFERSAL_FAIL_FAST ?? "0") === "1";
  const debug = (process.env.SHUFERSAL_DISCOVER_DEBUG ?? "0") === "1";

  // ✅ חשוב: הכפייה של sort=Size&sortdir=DESC כדי להביא PriceFull מוקדם יותר
  const base =
    "https://prices.shufersal.co.il/FileObject/UpdateCategory?catID=0&storeId=0&sort=Size&sortdir=DESC";

  const out: DiscoveredFile[] = [];
  const seen = new Set<string>();

  console.log(`[Discover] Shufersal: fetching UpdateCategory pages...`);

  for (let page = 1; page <= maxPages; page++) {
    const url = `${base}&page=${page}`;

    let html: string;
    try {
      html = await withRetry(
        () =>
          httpGetText(url, {
            timeoutMs: pageTimeoutMs,
            headers: {
              "User-Agent": "Mozilla/5.0",
              Accept: "text/html,*/*",
              Referer: "https://prices.shufersal.co.il/",
              "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
            },
          }),
        {
          retries,
          baseDelayMs,
          maxDelayMs,
          jitterRatio: 0.2,
          shouldRetry: shouldRetryHttp,
        }
      );
    } catch (e) {
      const msg = String((e as any)?.message ?? e);
      console.log(`[Discover] Shufersal: page ${page} failed (${msg})`);
      if (failFast) throw e;
      continue;
    }

    const $ = cheerio.load(html);

    const anchors = $("a[href]")
      .map((_, el) => $(el).attr("href") || "")
      .get()
      .filter(Boolean);

    // fallback regex (למקרה שה־DOM לא נתפס כמו שצריך)
    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    const regexFound: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = hrefRegex.exec(html)) !== null) regexFound.push(m[1] || "");

    const hrefs = [...anchors, ...regexFound]
      .map((h) => decodeHtmlEntities(h.trim()))
      .filter(Boolean);

    if (debug && page === 1) {
      console.log("[Discover debug] first 20 hrefs:", hrefs.slice(0, 20));
      console.log("[Discover debug] html head:", html.slice(0, 300));
    }

    for (const href of hrefs) {
      const abs = href.startsWith("http")
        ? href
        : new URL(href, "https://prices.shufersal.co.il/").toString();

      const filename = extractFilenameFromUrl(abs);
      if (!isPriceFullGz(filename)) continue;

      if (seen.has(abs)) continue;
      seen.add(abs);

      out.push({
        chain: "shufersal",
        file_url: abs,
        filename,
        store_id: extractStoreIdFromFilename(filename),
      });

      if (out.length >= maxFiles) break;
    }

    if (out.length >= maxFiles) break;
  }

  console.log(`[Discover] found ${out.length} PriceFull.gz links`);
  return out;
}
