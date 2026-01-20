export type ChainCode = "shufersal";

export type DiscoverResult = {
  chain: ChainCode;
  fileUrl: string;
  filename: string;
  storeId: string | null;
};

export type RawFileStatus = "downloaded" | "failed" | "skipped";

export type RawFileRowInsert = {
  chain: ChainCode;
  store_id: string | null;
  file_url: string;
  storage_path: string | null;
  sha256: string | null;
  status: RawFileStatus;
  fetched_at?: string;
  error: string | null;
};

export type PriceRowInsert = {
  raw_file_id: string;
  chain: ChainCode;
  store_id: string;

  item_code: string;
  item_name: string;
  price: number;
  quantity: number | null;
  unit: string | null;
  is_weighted: boolean | null;

  fetched_at: string; // ISO
};
