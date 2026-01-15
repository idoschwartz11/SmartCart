export type CategoryHe =
  | "מוצרי חלב"
  | "ירקות"
  | "פירות"
  | "מאפים"
  | "משקאות"
  | "מזווה"
  | "ניקיון"
  | "אחר";

export type CatalogItem = {
  id: string;
  nameHe: string;
  category: CategoryHe;
  icon: string; // emoji icon for minimal dependencies
};

export const CATEGORIES_ORDER: CategoryHe[] = [
  "מוצרי חלב",
  "ירקות",
  "פירות",
  "מאפים",
  "משקאות",
  "מזווה",
  "ניקיון",
  "אחר",
];

export const CATALOG: CatalogItem[] = [
  { id: "milk-coconut", nameHe: "חלב קוקוס", category: "מוצרי חלב", icon: "🥥" },
  { id: "cheese-yellow", nameHe: "גבינה צהובה", category: "מוצרי חלב", icon: "🧀" },
  { id: "cottage", nameHe: "קוטג׳", category: "מוצרי חלב", icon: "🥣" },
  { id: "yogurt", nameHe: "יוגורט", category: "מוצרי חלב", icon: "🍶" },
  { id: "eggs", nameHe: "ביצים", category: "מוצרי חלב", icon: "🥚" },

  { id: "tomato", nameHe: "עגבניות", category: "ירקות", icon: "🍅" },
  { id: "cucumber", nameHe: "מלפפון", category: "ירקות", icon: "🥒" },
  { id: "onion", nameHe: "בצל", category: "ירקות", icon: "🧅" },
  { id: "lettuce", nameHe: "חסה", category: "ירקות", icon: "🥬" },

  { id: "banana", nameHe: "בננות", category: "פירות", icon: "🍌" },
  { id: "apple", nameHe: "תפוחים", category: "פירות", icon: "🍎" },

  { id: "bread", nameHe: "לחם פרוס", category: "מאפים", icon: "🍞" },
  { id: "pita", nameHe: "פיתות", category: "מאפים", icon: "🥙" },

  { id: "water", nameHe: "מים", category: "משקאות", icon: "💧" },
  { id: "cola", nameHe: "קולה", category: "משקאות", icon: "🥤" },
  { id: "coffee", nameHe: "קפה", category: "משקאות", icon: "☕" },

  { id: "rice", nameHe: "אורז", category: "מזווה", icon: "🍚" },
  { id: "pasta", nameHe: "פסטה", category: "מזווה", icon: "🍝" },
  { id: "tuna", nameHe: "טונה", category: "מזווה", icon: "🐟" },
  { id: "olive-oil", nameHe: "שמן זית", category: "מזווה", icon: "🫒" },

  { id: "dish-soap", nameHe: "סבון כלים", category: "ניקיון", icon: "🧼" },
  { id: "paper-towels", nameHe: "מגבות נייר", category: "ניקיון", icon: "🧻" },
];

export function findCatalogByNameHe(nameHe: string): CatalogItem | undefined {
  const normalized = nameHe.trim();
  if (!normalized) return undefined;
  // This will use dynamic catalog if set via store, otherwise fallback to static CATALOG
  const catalog = (findCatalogByNameHe as any).catalog || CATALOG;
  return catalog.find((c: CatalogItem) => c.nameHe === normalized);
}

