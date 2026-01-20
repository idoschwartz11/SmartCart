import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

export async function downloadToFileAndHash(
  res: Response,
  outPath: string
): Promise<{ sha256: string; bytes: number }> {
  if (!res.body) throw new Error("Response has no body");

  const hash = crypto.createHash("sha256");
  const ws = createWriteStream(outPath);

  let bytes = 0;

  const tap = new Transform({
    transform(chunk, _enc, cb) {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += b.length;
      hash.update(b);
      cb(null, chunk);
    },
  });

  // Node fetch returns a web ReadableStream
  const nodeStream = Readable.fromWeb(res.body as any);
  await pipeline(nodeStream, tap, ws);

  return { sha256: hash.digest("hex"), bytes };
}
