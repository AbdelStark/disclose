# Decisions

## Manifest hash canonicalization
To avoid circular dependencies (bundle root and receipts would otherwise change the manifest hash), the manifest hash is computed from a canonicalized `disclosure.json` with these fields removed before hashing:
- `proof.bundle_root_sha256`
- `timestamps`
- `publication`

The bundle root is computed from that manifest hash + proof hashes and stored back into the manifest. Both web and CLI follow this rule.

## OpenTimestamps in CLI
Rust OpenTimestamps support is limited for stamping/upgrade against public calendars, so the CLI uses a small Node helper (`scripts/ots-helper.mjs`) that wraps the official JavaScript OpenTimestamps library. The helper is invoked locally via `node` and only receives digests and receipt paths.
