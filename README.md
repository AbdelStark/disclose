# Disclose

Disclose helps you create **responsible AI usage disclosures** with optional OpenTimestamps proof receipts - **without uploading raw proof files**.

## Repo layout
- `apps/web`: Next.js App Router web app
- `crates/disclose`: Rust CLI + TUI
- `shared/`: schemas, templates, and examples (source of truth)

## Quick start (web)
1. Install dependencies:
   - `pnpm install`
2. Start Postgres:
   - `docker compose up -d`
3. Configure env:
   - Copy `apps/web/.env.example` -> `apps/web/.env`
4. Run migrations:
   - `pnpm --filter web prisma migrate dev`
5. Start dev server:
   - `pnpm --filter web dev`

Visit `http://localhost:3000` and create a disclosure in `/new`.

## Quick start (CLI)
Build the CLI:
- `cargo build -p disclose`

Example workflow:
```bash
./target/debug/disclose init --template article --title "My Post" --out ./my-disclosure
./target/debug/disclose attach --path ./my-disclosure --proof notes.md --label "Raw notes" --created-before-ai
./target/debug/disclose meter --path ./my-disclosure --global-human 70 --global-ai 30
./target/debug/disclose stamp --path ./my-disclosure --ots
./target/debug/disclose export --path ./my-disclosure --bundle disclosure-bundle.zip
./target/debug/disclose publish --path ./my-disclosure --endpoint http://localhost:3000
```

## OpenTimestamps
- Web stamping runs entirely in the browser via the JS SDK.
- CLI stamping/upgrade/verify uses a small Node helper (`scripts/ots-helper.mjs`) that wraps the JS SDK.

## Verify OpenTimestamps locally
Disclose stamps the bundle root digest (not the original proof file bytes), so verification must use the digest.

OpenTimestamps CLI (from repo root):
```bash
BUNDLE_ROOT=$(jq -r '.bundle_root_sha256' ./hashes.json)

node node_modules/opentimestamps/ots-cli.js info ./receipts/bundle-root.ots
node node_modules/opentimestamps/ots-cli.js verify -d "$BUNDLE_ROOT" ./receipts/bundle-root.ots
node node_modules/opentimestamps/ots-cli.js upgrade ./receipts/bundle-root.ots
```

Helper script (same logic used by the CLI):
```bash
node scripts/ots-helper.mjs info --receipt ./receipts/bundle-root.ots
node scripts/ots-helper.mjs verify --receipt ./receipts/bundle-root.ots --digest "$BUNDLE_ROOT"
node scripts/ots-helper.mjs upgrade --receipt ./receipts/bundle-root.ots
```

If you do not have `jq`, open `hashes.json` and copy `bundle_root_sha256` directly.

## Publish payload
`POST /api/disclosures` expects:
```json
{
  "manifest": { "...": "disclosure.json" },
  "hashes": { "...": "hashes.json" },
  "receipts": [
    { "filename": "bundle-root.ots", "bytes_base64": "..." }
  ]
}
```

Returns:
```json
{ "slug": "abc123", "url": "http://localhost:3000/d/abc123" }
```

## Local-first guarantee
- Proof files stay local by default.
- Publishing sends only the manifest + hashes + optional receipts.
