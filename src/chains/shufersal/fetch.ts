import { createHash } from "node:crypto";
import { createWriteStream, promises as fsp } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export type FetchToTempResult = {
  tmpPath: string;
  sha256: string;
  bytes: number;
};

async function ensureDir(p: string) {
  await fsp.mkdir(p, { recursive: true });
}

function safeFilename(name: string) {
  return name.replace(/[^\w.\-]/g, "_");
}

export async function fetchGzToTempFile(params: {
  url: string;
  filename: string;
}): Promise<FetchToTempResult> {
  const { url, filename } = params;

  const tmpDir = join(process.cwd(), ".tmp", "shufersal");
  await ensureDir(tmpDir);

  const tmpPath = join(tmpDir, `${Date.now()}_${safeFilename(filename)}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "*/*",
      "Referer": "https://prices.shufersal.co.il/",
      "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
  });

  if (!res.ok) throw new Error(`Download HTTP ${res.status} for ${url}`);
  if (!res.body) throw new Error("Response has no body");

  const incoming = Readable.fromWeb(res.body as any);

  const hash = createHash("sha256");
  let bytes = 0;

  incoming.on("data", (chunk: Buffer) => {
    bytes += chunk.length;
    hash.update(chunk);
  });

  await pipeline(incoming, createWriteStream(tmpPath));

  return {
    tmpPath,
    sha256: hash.digest("hex"),
    bytes,
  };
}

export async function cleanupTempFile(path: string) {
  try {
    await fsp.unlink(path);
  } catch {}
}
