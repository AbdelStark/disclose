# Disclose — CLI & TUI Spec (Rust)

This spec defines a Rust-based CLI tool named `disclose` with both:
- a **non-interactive** mode (flags/subcommands)
- an **interactive TUI** mode (`disclose tui`)

Primary goal: create, manage, timestamp, verify, and publish disclosures in a local-first workflow.

---

## 1) Command Overview

### 1.1 Global Behavior
- All commands operate on a **disclosure directory** (a folder containing `disclosure.json` and local metadata).
- Commands should be composable and script-friendly.
- Output defaults to human-readable; `--json` switches to structured output.

### 1.2 Global Flags
- `--path <DIR>`: path to disclosure directory (defaults to `.` if it contains `disclosure.json`)
- `--json`: machine output
- `--quiet`: minimal output
- `--verbose`: more logs
- `--no-color`: disable ANSI color
- `--yes`: assume “yes” for prompts

Exit codes:
- `0` success
- `1` generic error
- `2` validation error (missing required fields, invalid meter)
- `3` verification failed
- `4` network error (publish/timestamp calendars)
- `5` file error (missing proof file, permission)

---

## 2) Disclosure Directory Format

A disclosure directory is a workspace:
```txt
my-disclosure/
├─ disclosure.json
├─ hashes.json                 # generated (sha256 per proof file + manifest)
├─ receipts/
│  └─ bundle-root.ots          # optional
├─ proof/                      # optional copies (user choice)
│  ├─ notes.md
│  └─ repo-snapshot.zip
└─ .disclose/
   ├─ state.json               # local tool state (draft, worker progress)
   └─ cache/                   # optional
```

Default: proof files can remain outside the folder; the tool stores hashes + paths.

---

## 3) Subcommands (MVP)

### 3.1 `disclose init`
Create a new disclosure directory.

**Usage**
```bash
disclose init --template article --title "My Post" --out ./my-disclosure
```

**Flags**
- `--template <slug>` (required)
- `--title <string>` (required)
- `--author <string>` (optional)
- `--out <dir>` (default `./disclose`)
- `--link <url>` (repeatable)

Creates:
- `disclosure.json` (draft)
- `.disclose/state.json`

---

### 3.2 `disclose attach`
Attach proof items (files, zips, or git references). Computes hashes locally.

**Usage**
```bash
disclose attach --path ./my-disclosure --proof notes.md --label "Raw notes" --created-before-ai
disclose attach --path ./my-disclosure --proof repo.zip --label "Repo snapshot"
disclose attach --path ./my-disclosure --git https://github.com/user/repo --commit abc123 --label "Pre-AI baseline commit"
```

**Flags**
- `--proof <path>` (repeatable)
- `--label <string>`
- `--note <string>`
- `--created-before-ai` / `--not-sure`
- `--copy-into ./proof` (copies file into workspace)
- `--git <url>` + `--commit <sha>` (metadata-only proof)

Outputs:
- updates `disclosure.json`
- updates `hashes.json`

---

### 3.3 `disclose meter`
Set assistance meter values.

**Usage**
```bash
disclose meter --path ./my-disclosure --global-human 70 --global-ai 30
disclose meter --path ./my-disclosure --stage drafting=heavy --stage editing=light
```

**Flags**
- `--global-human <0..100>`
- `--global-ai <0..100>` (optional; computed as 100-human)
- `--stage <key=grade>` (repeatable; grade in none|light|moderate|heavy|full)

Validation:
- global must sum to 100
- stage keys must exist for template (unless `--allow-unknown-stages`)

---

### 3.4 `disclose stamp`
Create an OpenTimestamps receipt for the disclosure bundle root hash.

**Usage**
```bash
disclose stamp --path ./my-disclosure --ots --calendars default
```

**Flags**
- `--ots` (enable OTS stamping)
- `--digest <hex>` (stamp an explicit digest instead of computing from workspace)
- `--calendars default|<url>[,<url>...]`
- `--out receipts/bundle-root.ots`
- `--upgrade` (attempt upgrade after stamping)
- `--timeout <seconds>`

Behavior:
- compute bundle root hash:
  - merkle root of proof file hashes + manifest hash
- submit digest to calendars
- write `.ots` receipt
- store receipt metadata into `disclosure.json`

Notes:
- Stamping is quick; completion (“complete attestation”) can take hours. Users can run `upgrade` later.

---

### 3.5 `disclose upgrade`
Upgrade a pending receipt into a complete one (when attested on-chain).

**Usage**
```bash
disclose upgrade --path ./my-disclosure --receipt receipts/bundle-root.ots
```

---

### 3.6 `disclose verify`
Verify a receipt against the workspace root hash.

**Usage**
```bash
disclose verify --path ./my-disclosure --receipt receipts/bundle-root.ots
```

Optional trustless mode:
- `--bitcoin-node <url>`
- `--bitcoin-user <user>`
- `--bitcoin-pass <pass>`

Exit code `3` if verification fails.

---

### 3.7 `disclose info`
Print human-readable info about the receipt and bundle digest.

---

### 3.8 `disclose export`
Create a zipped disclosure bundle.

**Usage**
```bash
disclose export --path ./my-disclosure --bundle disclose-bundle.zip --include-proof copies
```

**Flags**
- `--bundle <path>`
- `--include-proof none|hashes|copies` (default: `hashes`)
- `--include-receipts yes|no` (default yes)
- `--format zip|dir` (zip or folder output)

---

### 3.9 `disclose publish`
Publish manifest + hashes (+ optional receipts) to the Disclose web platform.

**Usage**
```bash
disclose publish --path ./my-disclosure --endpoint https://disclose.aislop.sh --token $DISCLOSE_TOKEN
```

Behavior:
- sends only:
  - disclosure manifest (sans raw proof)
  - proof hashes
  - optional receipts
- returns public URL slug

---

## 4) TUI Spec (`disclose tui`)

### 4.1 TUI Goals
- wizard-like experience for terminal users
- always show: “local-only” vs “public” boundaries
- predictable keys; no surprises

### 4.2 Screens
1. **Welcome**
   - create new / open existing
2. **Template select**
3. **Project info**
4. **Attach proof**
   - file picker (basic), list + status
5. **Assistance meter**
   - global split slider (left/right arrows)
   - per-stage grade chips (1–5)
6. **Timestamp**
   - enable toggle
   - stamp progress
7. **Preview**
   - disclosure summary in terminal
8. **Export & Publish**
   - export bundle
   - optional publish (token prompt)

### 4.3 Keybindings (suggested)
- `↑/↓` navigate lists
- `←/→` adjust sliders
- `Enter` select/confirm
- `Space` toggle
- `Tab` next field
- `Esc` back
- `?` help overlay
- `q` quit

### 4.4 TUI Libraries (suggested)
- `ratatui` for UI
- `crossterm` backend
- `clap` for CLI parsing
- `serde` + `serde_json` for manifest I/O
- `sha2` for hashing
- OpenTimestamps crate/client for stamping/verify

---

## 5) Output Formats

### 5.1 JSON output (`--json`)
All commands return:
- `ok: boolean`
- `action: string`
- `path: string`
- `result: { ... }`
- `errors?: []`

### 5.2 Deterministic hashing
- Default hash: SHA-256
- Store:
  - file hash
  - file size
  - normalized path (relative)
  - MIME guess (best effort)

---

## 6) Done Definition (CLI MVP)
- init/attach/meter/stamp/export/publish all work end-to-end
- verify/info/upgrade work for receipts
- TUI covers the main path without requiring docs
