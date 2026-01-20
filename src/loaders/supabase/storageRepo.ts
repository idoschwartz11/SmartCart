import { promises as fsp } from "node:fs";

export async function uploadToStorageFromFile(
  sb: any,
  params: { bucket: string; path: string; filePath: string; contentType: string }
) {
  const buf = await fsp.readFile(params.filePath);

  const { error } = await sb.storage
    .from(params.bucket)
    .upload(params.path, buf, {
      contentType: params.contentType,
      upsert: true,
    });

  if (error) throw error;
}
