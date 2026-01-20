export type HttpGetTextOptions = {
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export async function httpGetText(
  url: string,
  opts: HttpGetTextOptions = {}
): Promise<string> {
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 20_000;

  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: opts.headers,
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`HTTP timeout after ${timeoutMs}ms for ${url}`);
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}
