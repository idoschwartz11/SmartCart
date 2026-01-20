import sax from "sax";
import { createGunzip } from "node:zlib";
import type { Readable } from "node:stream";

export type PriceRow = {
  raw_file_id: number;
  chain: string;
  store_id: string | null;

  item_code: string | null;
  barcode: string | null;
  item_name: string | null;

  price: number | null;
  quantity: number | null;
  unit: string | null;
  is_weighted: boolean | null;

  fetched_at: string | null;
};

export type ParseOpts = {
  rawFileId: number;
  chain: string;
  storeId: string | null;
  fetchedAt: string | null;

  maxItems?: number;
  progressEvery?: number;
  batchSize?: number;

  onBatch: (rows: PriceRow[]) => Promise<void>;
};

function toNumber(v: string | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function parsePriceFullGzStream(
  gzStream: Readable,
  opts: ParseOpts
): Promise<{ items: number }> {
  const gunzip = createGunzip();

  // חשוב: SAX STREAM (Transform) כדי ש-Node לא ייפול עם dest.destroy
  const saxStream = sax.createStream(true, {
    trim: true,
    normalize: true,
  });

  const batchSize = opts.batchSize ?? 500;
  const progressEvery = opts.progressEvery ?? 5000;

  let currentTag: string | null = null;
  let inItem = false;

  let item: Record<string, string> = {};
  let batch: PriceRow[] = [];
  let count = 0;
  let done = false;

  function pushRowFromItem() {
    batch.push({
      raw_file_id: opts.rawFileId,
      chain: opts.chain,
      store_id: opts.storeId,

      item_code: item["ItemCode"] ?? null,
      barcode: item["ItemBarcode"] ?? null,
      item_name: item["ItemName"] ?? null,

      price: toNumber(item["ItemPrice"]),
      quantity: toNumber(item["Quantity"] ?? item["QtyInPackage"]),
      unit: item["UnitOfMeasure"] ?? null,
      is_weighted: item["IsWeighted"] != null ? item["IsWeighted"] === "1" : null,

      fetched_at: opts.fetchedAt,
    });
  }

  async function flushBatch() {
    if (batch.length === 0) return;
    const toSend = batch;
    batch = [];
    await opts.onBatch(toSend);
  }

  return await new Promise<{ items: number }>((resolve, reject) => {
    const fail = (err: unknown) => {
      if (done) return;
      done = true;
      try { gzStream.destroy(err as any); } catch {}
      try { gunzip.destroy(err as any); } catch {}
      try { saxStream.destroy(err as any); } catch {}
      reject(err);
    };

    gzStream.on("error", fail);
    gunzip.on("error", fail);
    saxStream.on("error", fail);

    saxStream.on("opentag", (node: any) => {
      currentTag = node.name;
      if (node.name === "Item") {
        inItem = true;
        item = {};
      }
    });

    saxStream.on("text", (text: string) => {
      if (!inItem || !currentTag) return;
      item[currentTag] = (item[currentTag] ?? "") + text;
    });

    saxStream.on("closetag", async (name: string) => {
      if (name === "Item") {
        inItem = false;
        currentTag = null;

        count += 1;
        pushRowFromItem();

        if (count % progressEvery === 0) {
          console.log(`[Parse] progress items=${count}`);
        }

        if (batch.length >= batchSize) {
          console.log(`[Load] inserting batch size=${batch.length}`);
          try {
            await flushBatch();
          } catch (e) {
            return fail(e);
          }
        }

        if (opts.maxItems && count >= opts.maxItems) {
          done = true;
          try {
            await flushBatch();
            resolve({ items: count });
          } catch (e) {
            fail(e);
          } finally {
            try {
              gzStream.destroy();
              gunzip.destroy();
              saxStream.end();
            } catch {}
          }
          return;
        }
      }

      if (currentTag === name) currentTag = null;
    });

    saxStream.on("end", async () => {
      if (done) return;
      done = true;
      try {
        await flushBatch();
        resolve({ items: count });
      } catch (e) {
        fail(e);
      }
    });

    gzStream.pipe(gunzip).pipe(saxStream);
  });
}

// backward-compat if some code calls parsePriceFullGz
export async function parsePriceFullGz(gzStream: Readable, opts: ParseOpts) {
  return parsePriceFullGzStream(gzStream, opts);
}
