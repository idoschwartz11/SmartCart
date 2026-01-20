# SmartShopList ETL (Scraper + Loader)

This is a standalone Node/TypeScript ETL that discovers **real** `PriceFull*.gz` files (starting with **Shufersal**), uploads the raw gz to Supabase Storage, and streams XML parsing into the `prices` table.

## Folder structure

```
src/
  core/              # engine utils: http, hashing, filenames, storage paths
  chains/
    shufersal/
      discover.ts    # HTML discovery (UpdateCategory)
      fetch.ts       # download to temp + sha256
  parsers/
    publishedprices/
      parse_pricefull.ts   # streaming XML parse (SAX + gunzip)
  loaders/
    supabase/
      client.ts
      rawFilesRepo.ts
      pricesRepo.ts
      storageRepo.ts
  runs/
    run_chain.ts
    run_all.ts
```

## Setup

1. Copy env and fill values:

```bash
cp .env.example .env
```

2. Install:

```bash
npm i
```

3. Ensure Supabase:
- Storage bucket: `raw-prices` (or set `SUPABASE_RAW_BUCKET`)
- Tables: `raw_files`, `prices`

### Minimal SQL (example)

> Adjust types/constraints to your schema.

```sql
create table if not exists raw_files (
  id uuid primary key default gen_random_uuid(),
  chain text not null,
  store_id text null,
  file_url text not null,
  storage_path text null,
  sha256 text null,
  status text not null,
  fetched_at timestamptz not null default now(),
  error text null
);

create index if not exists raw_files_chain_url on raw_files(chain, file_url);
create index if not exists raw_files_chain_sha on raw_files(chain, sha256);

create table if not exists prices (
  raw_file_id uuid not null references raw_files(id) on delete cascade,
  chain text not null,
  store_id text not null,
  item_code text not null,
  item_name text not null,
  price numeric not null,
  quantity numeric null,
  unit text null,
  is_weighted boolean null,
  fetched_at timestamptz not null,
  primary key (raw_file_id, item_code)
);
```

## Run

### Shufersal only

```bash
npm run dev:shufersal
```

### All chains (currently only Shufersal)

```bash
npm run dev:all
```

## Notes
- Discovery uses: `https://prices.shufersal.co.il/FileObject/UpdateCategory` with HTML parsing + regex fallback.
- Parser is streaming: `fs.createReadStream(gz) -> zlib.gunzip -> sax` (does not load full XML to memory).
- Dedup is sha256-based (`raw_files(chain, sha256)`), plus URL guard.
