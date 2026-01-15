import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { CATALOG, CategoryHe, CatalogItem } from "../data/catalog";
import { CHAINS, ChainName, PRICES } from "../data/prices";
import { fetchAllDataFromSupabase } from "../services/supabaseData";

export type ShoppingItem = {
  id: string;
  nameHe: string;
  category: CategoryHe;
  qty: number;
  checked: boolean;
};

type State = {
  items: ShoppingItem[];
};

type Action =
  | { type: "add"; payload: { nameHe: string; category?: CategoryHe } }
  | { type: "remove"; payload: { id: string } }
  | { type: "incQty"; payload: { id: string } }
  | { type: "decQty"; payload: { id: string } }
  | { type: "toggleChecked"; payload: { id: string } }
  | { type: "setQty"; payload: { id: string; qty: number } };

const initialState: State = {
  items: [
    { id: "milk-coconut", nameHe: "חלב קוקוס", category: "מוצרי חלב", qty: 1, checked: false },
    { id: "tomato", nameHe: "עגבניות", category: "ירקות", qty: 2, checked: false },
    { id: "bread", nameHe: "לחם פרוס", category: "מאפים", qty: 1, checked: true },
  ],
};

function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(0, Math.min(99, Math.floor(qty)));
}

function ensureIdFromName(nameHe: string, catalog: CatalogItem[]): { id: string; category: CategoryHe; nameHe: string } {
  return ensureIdFromNameWithCatalog(nameHe, catalog);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const nameHe = action.payload.nameHe.trim();
      if (!nameHe) return state;
      // NOTE: reducer is pure; we do not have catalog here. We keep behavior stable by using static catalog.
      const base = ensureIdFromName(nameHe, CATALOG);
      const category = action.payload.category ?? base.category;

      const existingIdx = state.items.findIndex((i) => i.id === base.id);
      if (existingIdx >= 0) {
        const next = [...state.items];
        next[existingIdx] = { ...next[existingIdx], qty: clampQty(next[existingIdx].qty + 1) };
        return { ...state, items: next };
      }

      return {
        ...state,
        items: [{ id: base.id, nameHe: base.nameHe, category, qty: 1, checked: false }, ...state.items],
      };
    }
    case "remove":
      return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
    case "incQty":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, qty: clampQty(i.qty + 1) } : i,
        ),
      };
    case "decQty":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, qty: clampQty(i.qty - 1) } : i,
        ),
      };
    case "setQty":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, qty: clampQty(action.payload.qty) } : i,
        ),
      };
    case "toggleChecked":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, checked: !i.checked } : i,
        ),
      };
    default:
      return state;
  }
}

type Store = {
  state: State;
  dispatch: React.Dispatch<Action>;
  data: {
    isLoading: boolean;
    catalog: CatalogItem[];
    chains: ChainName[];
    prices: Record<ChainName, Record<string, number>>;
  };
  derived: {
    averageNationalPriceById: Record<string, number>;
    totalsByChain: Record<ChainName, number>;
    averageTotal: number;
    cheapestChain: ChainName;
    cheapestTotal: number;
  };
};

const StoreContext = createContext<Store | null>(null);

function buildAverageNationalPriceById(
  catalog: CatalogItem[],
  chains: ChainName[],
  prices: Record<ChainName, Record<string, number>>,
): Record<string, number> {
  const ids = new Set<string>(catalog.map((c) => c.id));
  // include any ids in PRICES not in catalog (defensive)
  for (const chain of chains) {
    for (const id of Object.keys(prices[chain] || {})) ids.add(id);
  }
  const out: Record<string, number> = {};
  for (const id of ids) {
    let sum = 0;
    let count = 0;
    for (const chain of chains) {
      const p = prices[chain]?.[id];
      if (typeof p === "number") {
        sum += p;
        count += 1;
      }
    }
    out[id] = count ? sum / count : 0;
  }
  return out;
}

function calcTotalsByChain(
  items: ShoppingItem[],
  chains: ChainName[],
  prices: Record<ChainName, Record<string, number>>,
): Record<ChainName, number> {
  const totals: Record<ChainName, number> = {} as Record<ChainName, number>;
  for (const chain of chains) totals[chain] = 0;
  for (const item of items) {
    const qty = item.qty || 0;
    if (qty <= 0) continue;
    for (const chain of chains) {
      const p = prices[chain]?.[item.id];
      if (typeof p === "number") totals[chain] += p * qty;
    }
  }
  return totals;
}

function pickCheapest(totals: Record<ChainName, number>, chains: ChainName[]): { chain: ChainName; total: number } {
  if (chains.length === 0) {
    return { chain: "" as ChainName, total: 0 };
  }
  let best: ChainName = chains[0];
  let bestTotal = totals[best] ?? 0;
  for (const chain of chains) {
    const t = totals[chain] ?? 0;
    if (t < bestTotal || bestTotal === 0) {
      best = chain;
      bestTotal = t;
    }
  }
  return { chain: best, total: bestTotal };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [dataState, setDataState] = useState<Store["data"]>({
    isLoading: true,
    catalog: CATALOG,
    chains: CHAINS,
    prices: PRICES,
  });

  // Load data from Supabase on mount
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await fetchAllDataFromSupabase();

        // Check if we got valid data (not empty arrays/objects)
        if (mounted) {
          setDataState({
            isLoading: false,
            catalog: data.catalog.length > 0 ? data.catalog : CATALOG,
            chains: data.chains.length > 0 ? data.chains : CHAINS,
            prices: Object.keys(data.prices).length > 0 ? data.prices : PRICES,
          });
        }
      } catch (err) {
        console.warn("Failed to load data from Supabase, using local fallback:", err);
        if (mounted) {
          setDataState({
            isLoading: false,
            catalog: CATALOG,
            chains: CHAINS,
            prices: PRICES,
          });
        }
      }
    }

    // Only try Supabase if URL/key are configured
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && supabaseUrl !== "YOUR_SUPABASE_URL") {
      loadData();
    } else {
      setDataState((s) => ({ ...s, isLoading: false }));
    }

    return () => {
      mounted = false;
    };
  }, []);

  const derived = useMemo(() => {
    const averageNationalPriceById = buildAverageNationalPriceById(dataState.catalog, dataState.chains, dataState.prices);
    const totalsByChain = calcTotalsByChain(state.items, dataState.chains, dataState.prices);
    const totalsArr = dataState.chains.map((c) => totalsByChain[c] || 0);
    const averageTotal = totalsArr.reduce((a, b) => a + b, 0) / Math.max(1, totalsArr.length);
    const cheapest = pickCheapest(totalsByChain, dataState.chains);
    return {
      averageNationalPriceById,
      totalsByChain,
      averageTotal,
      cheapestChain: cheapest.chain,
      cheapestTotal: cheapest.total,
    };
  }, [state.items, dataState.catalog, dataState.chains, dataState.prices]);

  const value: Store = useMemo(() => ({ state, dispatch, data: dataState, derived }), [state, dataState, derived]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function ensureIdFromNameWithCatalog(
  nameHe: string,
  catalog: CatalogItem[],
): { id: string; category: CategoryHe; nameHe: string } {
  const normalized = nameHe.trim();
  const existing = catalog.find((c) => c.nameHe === normalized);
  if (existing) return { id: existing.id, category: existing.category, nameHe: existing.nameHe };
  const safe = normalized || "פריט";
  return { id: `custom:${safe}`.toLowerCase(), category: "אחר", nameHe: safe };
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

