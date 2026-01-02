This folder contains Supabase-related helpers and instructions for applying migrations and uploading static assets.

Steps to upload assets and (optionally) seed the `products` table with basic rows.

Prerequisites
- Node 18+ installed
- `npm install` has been run in project root (installs @supabase/supabase-js already in package.json)
- A Supabase project URL and a Service Role key (keep this secret)

Environment variables
- `SUPABASE_URL` - your Supabase REST URL (e.g. https://xyz.supabase.co)
- `SUPABASE_SERVICE_KEY` or `SUPABASE_KEY` - service role key (required for writing to DB)
- `SUPABASE_BUCKET` - optional, defaults to `products`
- `RUN_DB=true` - optional; if set, the upload script will also attempt to insert product rows using the uploaded URLs (use with caution)

Uploading assets

From project root run:

```bash
# Install dependencies if not present
npm install

# Dry run: upload assets and save mapping to scripts/uploads.json (no DB changes)
SUPABASE_URL="https://..." SUPABASE_SERVICE_KEY="<service_key>" node scripts/upload-assets.mjs

# If you want the script to also insert product rows (will write to DB):
SUPABASE_URL="https://..." SUPABASE_SERVICE_KEY="<service_key>" RUN_DB=true node scripts/upload-assets.mjs
```

Outputs
- `scripts/uploads.json` - JSON mapping of local filename -> public URL in storage.

Seeding products (SQL)
- The upload script creates `scripts/uploads.json`. You can convert that into SQL inserts or use it as reference to update `public.products.image_url`.

Applying migrations
- Use the Supabase CLI or psql to run the SQL files in `supabase/migrations` in chronological order.

Notes & safety
- Do not commit service keys to source control.
- Run these operations against a staging DB first if unsure.
