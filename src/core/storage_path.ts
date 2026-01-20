import { ChainCode } from "./types.js";

export function makeStoragePath(params: {
  chain: ChainCode;
  storeId: string;
  sha256: string;
  date?: Date;
}): string {
  const d = params.date ?? new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${params.chain}/${yyyy}-${mm}-${dd}/store_${params.storeId}/PriceFull_${params.sha256}.gz`;
}
