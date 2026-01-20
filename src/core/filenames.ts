export function isPriceFull(nameOrUrl: string): boolean {
  return /(\/|^)PriceFull\d+/i.test(nameOrUrl);
}

export function isPromo(nameOrUrl: string): boolean {
  return /(\/|^)Promo\d+/i.test(nameOrUrl);
}

export function extractStoreIdFromFilename(nameOrUrl: string): string | null {
  // PriceFull long: PriceFull<chain>-<sub>-<store>-YYYYMMDD-HHMMSS.gz
  let m = nameOrUrl.match(/PriceFull\d+-\d+-([0-9]{1,4})-\d{8}-\d{6}\.gz/i);
  if (m) return m[1].padStart(3, "0");

  // PriceFull short: PriceFull<chain>-<store>-YYYYMMDDHHMM.gz
  m = nameOrUrl.match(/PriceFull\d+-([0-9]{1,4})-\d{12}\.gz/i);
  if (m) return m[1].padStart(3, "0");

  // Price long: Price<chain>-<sub>-<store>-YYYYMMDD-HHMMSS.gz
  m = nameOrUrl.match(/Price\d+-\d+-([0-9]{1,4})-\d{8}-\d{6}\.gz/i);
  if (m) return m[1].padStart(3, "0");

  // Price short: Price<chain>-<store>-YYYYMMDDHHMM.gz
  m = nameOrUrl.match(/Price\d+-([0-9]{1,4})-\d{12}\.gz/i);
  if (m) return m[1].padStart(3, "0");

  return null;
}

export function filenameFromUrl(u: string): string {
  try {
    const url = new URL(u);
    const base = url.pathname.split("/").pop();
    if (base && base.toLowerCase().endsWith(".gz")) return base;
  } catch {
    // ignore
  }
  return `file_${Date.now()}.gz`;
}
