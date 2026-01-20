export async function upsertRawFileByChainSha(
  sb: any,
  row: {
    chain: string;
    store_id: string | null;
    file_url: string;
    filename: string;
    sha256: string;
    status?: string;
  }
): Promise<{ id: number; alreadyExists: boolean; status: string | null }> {
  const { data: existing, error: e0 } = await sb
    .from("raw_files")
    .select("id,status")
    .eq("chain", row.chain)
    .eq("sha256", row.sha256)
    .maybeSingle();

  if (e0) throw e0;

  if (existing?.id) {
    return { id: existing.id, alreadyExists: true, status: existing.status ?? null };
  }

  const { data, error } = await sb
    .from("raw_files")
    .insert({
      chain: row.chain,
      store_id: row.store_id,
      file_url: row.file_url,
      filename: row.filename,
      sha256: row.sha256,
      status: row.status ?? "discovered",
      fetched_at: null,
      processed_at: null,
      error: null,
    })
    .select("id,status")
    .single();

  if (error) throw error;
  return { id: data.id, alreadyExists: false, status: data.status ?? null };
}

export async function updateRawFile(
  sb: any,
  rawFileId: number,
  patch: Partial<{
    status: string;
    storage_path: string | null;
    fetched_at: string | null;
    processed_at: string | null;
    error: string | null;
    file_url: string | null;
    filename: string | null;
    store_id: string | null;
  }>
) {
  const { error } = await sb.from("raw_files").update(patch).eq("id", rawFileId);
  if (error) throw error;
}

/**
 * Claim רך למנוע ריצה כפולה במקביל.
 * מחזיר true אם הצליח "לתפוס" ולעדכן סטטוס ל-loading.
 */
export async function claimRawFileForLoading(
  sb: any,
  rawFileId: number,
  allowedStatuses: string[] = ["uploaded", "ready"]
): Promise<boolean> {
  const { data, error } = await sb
    .from("raw_files")
    .update({ status: "loading", error: null })
    .eq("id", rawFileId)
    .in("status", allowedStatuses)
    .select("id");

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}
