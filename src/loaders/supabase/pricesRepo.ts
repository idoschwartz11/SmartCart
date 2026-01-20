import type { SupabaseClient } from "@supabase/supabase-js";
import type { PriceRow } from "../../core/types.ts";

/**
 * מוחק את כל המחירים עבור raw_file_id (אסטרטגיית שלב 2: replace by raw_file_id).
 */
export async function deletePricesByRawFileId(
  sb: SupabaseClient,
  rawFileId: number
) {
  const { error } = await sb.from("prices").delete().eq("raw_file_id", rawFileId);
  if (error) throw new Error(`prices.deleteByRawFileId failed: ${error.message}`);
}

/**
 * Insert של batch יחיד.
 */
export async function insertPricesBatch(sb: SupabaseClient, rows: PriceRow[]) {
  if (!rows.length) return;
  const { error } = await sb.from("prices").insert(rows);
  if (error) throw new Error(`prices.insert failed: ${error.message}`);
}

/**
 * Replace מלא: קודם delete לפי raw_file_id ואז insert ב-batches.
 * שימוש כשיש לך כבר את כל rows בזיכרון.
 */
export async function replacePricesByRawFileId(
  sb: SupabaseClient,
  rawFileId: number,
  rows: PriceRow[],
  batchSize = 500
) {
  await deletePricesByRawFileId(sb, rawFileId);

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`[Load] inserting batch size=${batch.length}`);
    await insertPricesBatch(sb, batch);
  }
}
