# Disclose — Monorepo Structure (Web + CLI)

Recommended monorepo layout using **pnpm workspaces + Turborepo** (or just pnpm).  
The goal is to keep:
- web app isolated and deployable to Vercel
- Rust CLI buildable/releasable (GitHub Actions)
- shared schemas/specs in one place

---

## 1) Folder Tree

```txt
disclose/
├─ apps/
│  └─ web/
│     ├─ app/
│     │  ├─ page.tsx
│     │  ├─ new/
│     │  │  └─ page.tsx
│     │  ├─ d/
│     │  │  └─ [slug]/page.tsx
│     │  ├─ templates/page.tsx
│     │  ├─ verify/page.tsx
│     │  └─ api/
│     │     ├─ disclosures/route.ts        # POST publish
│     │     ├─ disclosures/[slug]/route.ts # GET public JSON
│     │     ├─ templates/route.ts
│     │     └─ health/route.ts
│     ├─ components/
│     │  ├─ shell/
│     │  ├─ wizard/
│     │  ├─ proof/
│     │  ├─ meter/
│     │  ├─ timestamp/
│     │  ├─ disclosure/
│     │  └─ ui/
│     ├─ lib/
│     │  ├─ hashing/
│     │  ├─ ots/
│     │  ├─ bundle/
│     │  ├─ api/
│     │  └─ templates/
│     ├─ public/
│     │  └─ assets/
│     ├─ tailwind.config.ts
│     └─ next.config.js
├─ crates/
│  └─ disclose/
│     ├─ Cargo.toml
│     ├─ src/
│     │  ├─ main.rs
│     │  ├─ commands/
│     │  ├─ tui/
│     │  ├─ hashing.rs
│     │  ├─ manifest.rs
│     │  ├─ ots.rs
│     │  └─ publish.rs
│     └─ tests/
├─ shared/
│  ├─ schemas/
│  │  └─ disclosure.schema.json
│  ├─ templates/
│  │  ├─ article.json
│  │  └─ code.json
│  ├─ tokens/
│  │  └─ tokens.json
│  └─ examples/
│     └─ disclosure.example.json
├─ docs/
│  ├─ PRD.md
│  ├─ WEB_UI_SPEC.md
│  ├─ CLI_SPEC.md
│  ├─ DESIGN_SYSTEM.md
│  └─ MONOREPO_STRUCTURE.md
├─ turbo.json
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```

---

## 2) Route-to-PRD Mapping (Web)

### `/new`
Wizard flow:
- `Wizard`
- `TemplatePicker`
- `ProjectInfoForm`
- `ProofLedger`
- `AiToolsForm`
- `AssistanceMeter`
- `TimestampStep`
- `DisclosurePreview`
- `ExportPanel`
- `PublishPanel`

### `/d/[slug]`
Public disclosure page:
- `DisclosureCard`
- `ProofHashTable`
- `TimestampReceiptPanel`
- `VerificationHints` (CLI instructions)

---

## 3) Shared Contracts
- `shared/schemas/disclosure.schema.json` is the single source of truth
- Web validates manifests before publishing
- CLI validates manifests on read/write
- Templates define stage lists and recommended proof types

---

## 4) Release Strategy (suggested)
- Web: Vercel deploy from `apps/web`
- CLI: GitHub Releases + `cargo install` support
- Optional: Homebrew tap later
