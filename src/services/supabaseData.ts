import { supabase } from "../lib/supabase";
import { CatalogItem, CategoryHe } from "../data/catalog";
import { ChainName } from "../data/prices";

/**
 * Your Supabase schema (as provided):
 *
 * prices:
 *  - id (bigint)
 *  - chain (string)                // Hebrew chain name
 *  - store_id
 *  - item_code
 *  - barcode
 *  - item_name (string)            // Hebrew item name
 *  - canonical_key (string)        // stable item key (we use this as our item id)
 *  - price (number)                // ILS
 *  - unit_qty, unit_of_measure, ...
 *  - fetched_at (timestamp)
 *  - price_update_time (timestamp)
 */

export type SupabasePrice = {
  chain: string;
  canonical_key: string;
  item_name: string | null;
  price: number;
  fetched_at?: string | null;
  price_update_time?: string | null;
};

/**
 * Fetch catalog items from Supabase
 */
export async function fetchCatalogFromSupabase(): Promise<CatalogItem[]> {
  try {
    // Derive catalog from the prices table (distinct canonical_key)
    const { data, error } = await supabase
      .from("prices")
      .select("canonical_key, item_name")
      .not("canonical_key", "is", null)
      .order("price_update_time", { ascending: false })
      .limit(2000);

    if (error) {
      console.error("Error fetching catalog:", error);
      return [];
    }

    // Keep the latest name per canonical_key
    const seen = new Set<string>();
    const out: CatalogItem[] = [];

    for (const row of (data || []) as Array<{ canonical_key: string; item_name: string | null }>) {
      const id = row.canonical_key?.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);

      // We don't have categories in DB: fallback to "אחר"
      out.push({
        id,
        nameHe: (row.item_name || id).trim(),
        category: "אחר" as CategoryHe,
        icon: "🧾",
      });
    }

    return out;
  } catch (err) {
    console.error("Failed to fetch catalog:", err);
    return [];
  }
}

/**
 * Fetch chains from Supabase
 */
export async function fetchChainsFromSupabase(): Promise<ChainName[]> {
  try {
    const { data: pricesData, error: pricesError } = await supabase
      .from("prices")
      .select("chain")
      .not("chain", "is", null)
      .limit(5000);

    if (pricesError || !pricesData) {
      console.error("Error fetching chains:", pricesError);
      return [];
    }

    const uniqueChains = Array.from(new Set(pricesData.map((p: any) => p.chain).filter(Boolean)));
    return uniqueChains.map((c) => c as ChainName);
  } catch (err) {
    console.error("Failed to fetch chains:", err);
    return [];
  }
}

/**
 * Fetch prices from Supabase
 * Returns a map: chainName -> itemId -> price
 */
export async function fetchPricesFromSupabase(): Promise<Record<ChainName, Record<string, number>>> {
  try {
    /**
     * Requirement:
     * For each chain, compute per-product average across N stores:
     *  - For each (chain, canonical_key, store_id): take the most recent price (by price_update_time).
     *  - Then average across stores for that (chain, canonical_key).
     *
     * We do it client-side to avoid requiring SQL/RPC changes.
     */

    const PAGE_SIZE = 5000;
    const MAX_ROWS = 50000; // safety cap to avoid huge memory/network use
    const maxPages = Math.ceil(MAX_ROWS / PAGE_SIZE);

    // newest first so "first seen" per (chain,item,store) is the latest price
    const latestPerStore: Record<string, number> = {};

    let fetched = 0;
    for (let page = 0; page < maxPages; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("prices")
        .select("chain, canonical_key, store_id, price, price_update_time")
        .not("chain", "is", null)
        .not("canonical_key", "is", null)
        .not("store_id", "is", null)
        .order("price_update_time", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching prices:", error);
        return {} as Record<ChainName, Record<string, number>>;
      }

      const rows = (data || []) as Array<
        SupabasePrice & { store_id: string | number | null; price_update_time?: string | null }
      >;

      if (!rows.length) break;
      fetched += rows.length;

      for (const row of rows) {
        const chainName = row.chain?.trim();
        const itemId = row.canonical_key?.trim();
        const storeId = row.store_id;
        const price = row.price;
        if (!chainName || !itemId || storeId == null || typeof price !== "number") continue;

        const key = `${chainName}::${itemId}::${storeId}`;
        if (latestPerStore[key] !== undefined) continue; // already have latest for that store
        latestPerStore[key] = price;
      }

      if (fetched >= MAX_ROWS) break;
      if (rows.length < PAGE_SIZE) break;
    }

    // Aggregate per (chain,item) across stores
    const sums: Record<string, { sum: number; count: number }> = {};
    for (const key of Object.keys(latestPerStore)) {
      const [chainName, itemId] = key.split("::");
      const aggKey = `${chainName}::${itemId}`;
      const price = latestPerStore[key];
      const entry = (sums[aggKey] ??= { sum: 0, count: 0 });
      entry.sum += price;
      entry.count += 1;
    }

    const result: Record<string, Record<string, number>> = {};
    for (const aggKey of Object.keys(sums)) {
      const [chainName, itemId] = aggKey.split("::");
      const { sum, count } = sums[aggKey];
      if (!chainName || !itemId || !count) continue;
      if (!result[chainName]) result[chainName] = {};
      result[chainName][itemId] = sum / count;
    }

    return result as Record<ChainName, Record<string, number>>;
  } catch (err) {
    console.error("Failed to fetch prices:", err);
    return {} as Record<ChainName, Record<string, number>>;
  }
}

/**
 * Fetch all data from Supabase in one call
 */
export async function fetchAllDataFromSupabase(): Promise<{
  catalog: CatalogItem[];
  chains: ChainName[];
  prices: Record<ChainName, Record<string, number>>;
}> {
  const [catalog, chains, prices] = await Promise.all([
    fetchCatalogFromSupabase(),
    fetchChainsFromSupabase(),
    fetchPricesFromSupabase(),
  ]);

  return { catalog, chains, prices };
}
