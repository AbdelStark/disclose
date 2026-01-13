# Disclose — Product Requirements Document (PRD)

**Project:** Disclose  
**Domain / Hosting:** `disclose.aislop.sh` on Vercel  
**Monorepo:** Web app (Next.js) + CLI/TUI (Rust)  
**Core promise:** Help creators **disclose AI usage responsibly** with verifiable “human proof” and optional **OpenTimestamps** attestation—without uploading private source materials.

---

## 1) Vision

AI assistance is common. The problem is that disclosure is usually:
- vague (“AI helped”)
- unverifiable (“trust me”)
- inconsistent across mediums (articles vs code vs video)

**Disclose** creates a simple, repeatable “nutrition label” for AI involvement, backed by optional cryptographic timestamping that proves *your human-authored artifacts existed before AI intervention*—without making you publish them.

Disclose is two products in one:
- **Web app**: a guided disclosure flow with great UX and templates by use case.
- **CLI/TUI**: a local-first tool for technical workflows (Git repos, files, CI-friendly).

---

## 2) Goals

### Product Goals
1. **Local-first proof handling**: user artifacts remain on-device by default.
2. **Clear disclosure**: show AI assistance level + what AI was used for, in plain language.
3. **Verifiable integrity**: generate hashes and optional OpenTimestamps receipts for proof bundles.
4. **Guided by use case**: a disclosure wizard that adapts to content type (blog post vs code vs video).
5. **Shareable outcome**: create a public disclosure page (manifest + hashes) and a downloadable bundle.

### CLI Goals
1. Simple “happy path” (`init → attach → stamp → export`).
2. A **TUI wizard** for interactive use.
3. A **non-interactive** mode via flags for scripts/CI.
4. Verification utilities (`verify`, `upgrade`, `info`) for receipts.

---

## 3) Non-goals (MVP)

- Not a plagiarism detector.
- Not a “proof of authorship” system; it’s **proof of existence at time T** for specific artifacts.
- Not a general content hosting platform (publishing is for the disclosure record, not the proof files).
- Not a KYC identity system (auth can come later).

---

## 4) Personas & Use Cases

### 4.1 Personas
- **Writer / blogger**: wants to disclose AI help (proofreading vs drafting).
- **Engineer**: wants to publish a repo + disclose AI assistance and prove the “human baseline” existed.
- **Researcher / student**: wants a transparent assistance breakdown plus proof artifacts (notes, outline).
- **Creator (video/podcast/design)**: wants a simple disclosure plus timestamped raw materials.

### 4.2 Use Cases (first-class templates)
1. **Article / Blog Post**
2. **Technical Project (Git repo / code)**
3. **Academic / Research Write-up**
4. **Video / Podcast**
5. **Design / Creative Work**
6. **Other / Custom**

Each template changes:
- required “human proof” types
- recommended assistance meter configuration
- disclosure language suggestions

---

## 5) Core Concepts

### 5.1 Disclosure Record
A disclosure is a machine-readable manifest (JSON) + optional public page.

**The disclosure includes**
- Project metadata (title, author, links)
- Use case + template version
- AI tools used (optional list, versions if known)
- Assistance breakdown (global + optional per-stage)
- Human proof artifacts list (hashes + metadata)
- Optional OpenTimestamps receipt(s) for the bundle
- Exported bundle hash (root hash)
- Optional publication details (URL, created_at)

### 5.2 Human Proof
“Human proof” is anything that plausibly predates AI intervention:
- raw notes, scratch docs, outline
- voice memo, video explanation, whiteboard recording
- early draft / pre-AI text
- Git commit or zipped repo snapshot (pre-AI changes)

**MVP privacy stance**
- Proof files are **never uploaded by default**.
- Web app processes proof files **in the browser** (hashing, bundling, stamping).
- When publishing a disclosure, the server stores only:
  - manifest metadata
  - hashes (not contents)
  - optional OTS receipt files

### 5.3 Assistance Meter
Disclose uses a **human↔AI contribution split** that is:
- clear to humans
- exportable to JSON
- adaptable per use case
- honest about uncertainty (self-reported)

**MVP approach**
- **Global split**: Human % vs AI % (sum to 100).
- **Per-stage breakdown (recommended)**: a few stages depending on template; each stage uses a 5‑level grade that maps to an approximate percentage range.

Example stage grade:
- `None (0%)`
- `Light (~10%)`
- `Moderate (~30%)`
- `Heavy (~60%)`
- `Full (~90–100%)`

Store both:
- `grade` (what user selected)
- `approx_percent` (computed mapping)  
This avoids false precision while still enabling charts.

---

## 6) User Journey (Web App)

### 6.1 Start
User clicks **New Disclosure**.

### 6.2 Select use case
Choose from templates. Show examples and best practices.

### 6.3 Add project info
- Title
- Author name/handle (optional)
- Links (draft URL, repo URL, etc.)
- Intended disclosure audience (public, employer, school, publication)

### 6.4 Upload / Attach human proof (local-first)
User adds proof items. For each:
- file type, short label, optional notes
- “created before AI?” confirmation checkbox

Supported proof inputs (MVP):
- file upload (pdf/txt/md/docx)
- image (png/jpg)
- audio (m4a/mp3/wav)
- video (mp4/mov) — with size guidance
- zip file (repo snapshot)
- “Git commit” reference (commit hash + repo URL) as metadata

### 6.5 Declare AI usage
- list tools used (optional)
- optional “AI usage notes” (short free text)
- select assistance level (global + per-stage)

### 6.6 Optional: OpenTimestamps
Recommended toggle: **Timestamp this disclosure bundle**.
- The app computes a **bundle root hash** locally (Merkle root of proof file hashes + manifest hash).
- It creates an `.ots` receipt for that root hash and submits to remote calendars.
- The receipt is saved locally and optionally included in the published disclosure record.

### 6.7 Preview & export
User sees a “Disclosure Card” preview:
- plain-language summary
- assistance meter
- proof list (hashes only)
- timestamp status

Export options:
- Download **Disclosure Bundle** (`.zip`):
  - `disclosure.json`
  - `proof/` (optional: original proof files)
  - `hashes.json`
  - `timestamps/*.ots`
- Publish disclosure page (manifest + hashes + receipt, no raw files)

---

## 7) User Journey (CLI/TUI)

### 7.1 CLI happy path (non-interactive)
```bash
disclose init --template article --title "My Post" --out ./disclose
disclose attach ./disclose --proof notes.md --label "Raw notes"
disclose attach ./disclose --proof voice.m4a --label "Voice memo"
disclose meter ./disclose --global-human 70 --global-ai 30
disclose stamp ./disclose --ots --calendars default
disclose export ./disclose --bundle disclose-bundle.zip
disclose publish ./disclose --endpoint https://disclose.aislop.sh --token $DISCLOSE_TOKEN
```

### 7.2 TUI wizard
`disclose tui` launches a guided flow mirroring the web steps:
- template selection
- proof attachment (file picker)
- assistance meter configuration
- timestamping (with progress)
- export + publish

---

## 8) OpenTimestamps Integration

### 8.1 Principles
- **Hash locally** (never upload raw files for timestamping).
- Submit only digest(es) to public calendar servers.
- Store resulting `.ots` receipt(s) in the bundle.

### 8.2 Web SDK
Use the OpenTimestamps JS implementation (commonly published on npm as `opentimestamps`, historically `javascript-opentimestamps`).

Supported operations include:
- create detached timestamp from hash (`DetachedTimestampFile.fromHash`)
- stamp against remote calendars (`OpenTimestamps.stamp`)
- serialize receipt to bytes (`serializeToBytes`)
- deserialize and show info (`info`)  
(These APIs are documented by OpenTimestamps examples and community tutorials.)

### 8.3 Rust SDK
For the CLI, use Rust libraries that can:
- create and serialize `.ots` receipts
- stamp/upgrade/verify receipts
- optionally verify with a local Bitcoin node (recommended for highest assurance)

MVP implementation may use an existing Rust OpenTimestamps client crate or implement calendar interactions on top of the `opentimestamps` crate.

### 8.4 Verification note
Fully trustless verification can require local access to Bitcoin headers (e.g., via a local node). The CLI should support this; the web app may provide “best-effort” verification via upgrades + receipt validation and explain the trust model clearly.

---

## 9) Data Model (Server)

### 9.1 Stored by platform (public disclosure)
- `disclosure` manifest (excluding raw proof file contents)
- list of proof hashes + metadata (filename, size, mime, created_at as user-provided)
- timestamp receipts (`.ots`) if user chooses to upload them for public verification
- publication metadata (URL slug, created_at, updated_at)

### 9.2 Never stored by default
- raw proof files
- raw prompts or private chats (unless user explicitly includes them, discouraged)

---

## 10) Security & Privacy

### 10.1 Local-first defaults
- Hashing and bundle construction are client-side.
- Publishing sends only manifest + hashes (+ optional receipts).

### 10.2 PII safety
- The UI should warn users if files appear to contain emails/phone numbers.
- “Redaction suggestion” step (MVP: static warnings + checklist).

### 10.3 Abuse prevention
- Rate limit publish endpoints.
- Signed URLs only if you ever introduce optional proof hosting later.
- Clear disclaimer: “Disclose does not guarantee anonymity.”

---

## 11) Web App UX/UI

### Design direction: “Notary Pop”
- Paper-like surfaces + bold ink borders
- Stamp/seal motifs (“Verified”, “Timestamped”, “Self-Reported”)
- Friendly forms, ultra-clear stepper
- High trust, low friction

Primary visuals:
- **Disclosure Card** (shareable, printable)
- **Assistance Split Bar** (Human vs AI)
- **Proof Ledger** (list with hashes + status)
- **Timestamp Seal** (Pending vs Complete)

---

## 12) Technical Architecture

### 12.1 Web (Next.js on Vercel)
- App Router + React
- Client-side hashing (WebCrypto)
- Optional: Web Worker for hashing large files
- API routes for publish + retrieval

### 12.2 Database
Postgres (Vercel Postgres/Neon/Supabase) + Prisma

Tables (MVP):
- `disclosures`
- `proof_items`
- `ots_receipts`
- `templates`
- `api_tokens` (optional for CLI publish)

### 12.3 APIs (MVP)
- `POST /api/disclosures` (publish)
- `GET /api/disclosures/[slug]` (public page JSON)
- `GET /api/templates` (use case templates)
- `POST /api/verify` (optional: server-side help verifying receipts—should be clearly labeled as “assisted”)

### 12.4 Monorepo
- `apps/web` (Next.js)
- `crates/disclose` (CLI/TUI)
- shared specs + schemas in `packages/spec` or `shared/`

---

## 13) MVP Scope

### Must ship
- Web wizard for at least 2 templates (Article + Code)
- Local hashing + bundle export
- Assistance meter (global + per-stage)
- OpenTimestamps stamping in web (optional step)
- Publish disclosure manifest + view public page
- CLI: init/attach/meter/stamp/export/verify/info + TUI

### Later
- Auth (GitHub/Twitter/X)
- GitHub integration (commit selection, PR integration)
- Team/org workspaces
- Reputation/attestation system
- Optional encrypted proof hosting

---

## 14) Success Metrics
- Completion rate of disclosure flow
- % of disclosures with timestamping enabled
- Bundle export rate
- CLI adoption (downloads, publishes)
- Verification attempts (people checking receipts)

---

## 15) Disclaimers (required)
- “Assistance levels are self‑reported.”
- “OpenTimestamps proves existence of digests at or before a time—not authorship.”
- “Publishing a disclosure does not publish your proof files unless you explicitly include them.”
