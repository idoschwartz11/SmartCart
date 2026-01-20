import "dotenv/config";
import { createReadStream } from "node:fs";

import { createSupabaseAdmin } from "../loaders/supabase/client.ts";
import { uploadToStorageFromFile } from "../loaders/supabase/storageRepo.ts";
import {
  upsertRawFileByChainSha,
  updateRawFile,
  claimRawFileForLoading,
} from "../loaders/supabase/rawFilesRepo.ts";
import { deletePricesByRawFileId, insertPricesBatch } from "../loaders/supabase/pricesRepo.ts";

import { discoverShufersalPriceFullFiles } from "../chains/shufersal/discover.ts";
import { fetchGzToTempFile, cleanupTempFile } from "../chains/shufersal/fetch.ts";
import { parsePriceFullGz } from "../parsers/publishedprices/parse_pricefull.ts";

function todayYYYYMMDD() {
  return new Date().toISOString().slice(0, 10);
}

function forceReprocess() {
  return String(process.env.FORCE_REPROCESS ?? "0") === "1";
}

function maxItemsPerFile(): number | undefined {
  const v = process.env.MAX_ITEMS_PER_FILE;
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function makeStoragePath(params: {
  chain: string;
  date: string;
  storeId: string | null;
  sha256: string;
}) {
  const storePart = params.storeId ? `store_${params.storeId}` : "store_unknown";
  return `${params.chain}/${params.date}/${storePart}/PriceFull_${params.sha256}.gz`;
}

async function runShufersal() {
  const sb = createSupabaseAdmin();

  const files = await discoverShufersalPriceFullFiles();
  const limitFiles = Number(process.env.SHUFERSAL_MAX_FILES ?? files.length);
  const selected = files.slice(0, limitFiles);

  const runDate = todayYYYYMMDD();
  const force = forceReprocess();
  const maxItems = maxItemsPerFile();

  for (const f of selected) {
    let tmpPath: string | null = null;
    let rawFileId: number | null = null;

    try {
      console.log(`\n[Fetch] ${f.filename} (store=${f.store_id ?? "?"})`);

      const dl = await fetchGzToTempFile({ url: f.file_url, filename: f.filename });
      tmpPath = dl.tmpPath;

      console.log(`[Hash] sha256=${dl.sha256} bytes=${dl.bytes.toLocaleString()}`);

      // DB dedupe (chain+sha)
      const up = await upsertRawFileByChainSha(sb, {
        chain: f.chain,
        store_id: f.store_id,
        file_url: f.file_url,
        filename: f.filename,
        sha256: dl.sha256,
        status: "discovered",
      });

      rawFileId = up.id;

      // ✅ Skip רק אם כבר LOADED ולא ביקשת force
      if (up.alreadyExists && up.status === "loaded" && !force) {
        console.log(`[Skip] duplicate sha256 already loaded (raw_file_id=${rawFileId})`);
        if (tmpPath) await cleanupTempFile(tmpPath);
        continue;
      }

      // ✅ אם קיים אבל לא loaded — ננסה לעבד מחדש
      if (up.alreadyExists && up.status !== "loaded") {
        console.log(
          `[Reprocess] duplicate sha256 but status=${up.status ?? "null"} (raw_file_id=${rawFileId})`
        );
      }

      // Upload to Storage with sha-based path
      const path = makeStoragePath({
        chain: f.chain,
        date: runDate,
        storeId: f.store_id,
        sha256: dl.sha256,
      });

      console.log(`[Upload] -> raw-prices/${path}`);

      await uploadToStorageFromFile(sb, {
        bucket: "raw-prices",
        path,
        filePath: tmpPath,
        contentType: "application/gzip",
      });

      await updateRawFile(sb, rawFileId, {
        storage_path: path,
        status: "uploaded",
        fetched_at: new Date().toISOString(),
        error: null,
      });

      // ===== Stage 2: Parse + Load =====
      console.log(`[Parse] start raw_file_id=${rawFileId}`);

      // Claim (מונע ריצה כפולה) — מאפשר claim רק אחרי upload
      const claimed = await claimRawFileForLoading(sb, rawFileId, ["uploaded"]);
      if (!claimed && !force) {
        console.log(`[Skip] raw_file_id=${rawFileId} already claimed/processed`);
        if (tmpPath) await cleanupTempFile(tmpPath);
        continue;
      }

      // ✅ Stage 2 Strategy: DELETE by raw_file_id before inserting
      console.log(`[Load] delete existing rows for raw_file_id=${rawFileId}`);
      await deletePricesByRawFileId(sb, rawFileId);

      let totalInserted = 0;

      await parsePriceFullGz(createReadStream(tmpPath), {
        rawFileId,
        chain: f.chain,
        storeId: f.store_id,
        fetchedAt: new Date().toISOString(),
        maxItems,
        batchSize: 500,
        progressEvery: 5000,
        onBatch: async (rows) => {
          await insertPricesBatch(sb, rows);
          totalInserted += rows.length;
        },
      });

      await updateRawFile(sb, rawFileId, {
        status: "loaded",
        processed_at: new Date().toISOString(),
        error: null,
      });

	const day = new Date().toISOString().slice(0, 10); // או אם אתה רוצה לפי fetched_at שבפועל
	await sb.rpc("aggregate_product_stats_daily", { p_day: day, p_chain: f.chain });
	console.log(`[Aggregate] day=${day} chain=${f.chain} done`);

		

      console.log(`[Done] raw_file_id=${rawFileId} inserted=${totalInserted.toLocaleString()}`);

      if (tmpPath) await cleanupTempFile(tmpPath);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.log(`[Error] ${f.filename}: ${msg}`);

      if (rawFileId != null) {
        try {
          await updateRawFile(sb, rawFileId, {
            status: "failed",
            error: msg.slice(0, 8000),
          });
        } catch {}
      }

      if (tmpPath) await cleanupTempFile(tmpPath);
    }
  }
}

async function main() {
  const chain = process.argv[2];
  if (!chain) throw new Error("Usage: tsx src/runs/run_chain.ts <chain>");

  if (chain === "shufersal") {
    await runShufersal();
    return;
  }

  throw new Error(`Unknown chain: ${chain}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
