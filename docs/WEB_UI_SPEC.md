# Disclose — Web UI Spec (Component-Level)

This spec defines the **web app UI system** for Disclose: components, behavior, props/state, and key flows.  
Target stack: **Next.js App Router + Tailwind + TypeScript**.

Design direction: **Notary Pop** (paper surfaces, bold borders, seals/stamps, friendly “ledger” metaphors).

---

## 0) Global UX Principles

- **Local-first clarity**: always show what stays on-device vs what gets published.
- **Trust by transparency**: explain what timestamps prove (and what they don’t) in-context.
- **Friction where it matters**: warnings for PII/sensitive uploads; otherwise keep the flow fast.
- **Disclosure is a product**: a disclosure should look shareable and “official,” not like a settings page.

---

## 1) App Layout

### 1.1 `AppShell`
- `TopNav`
- main container (max width 1040–1200px)
- `Footer`

### 1.2 Page routes
- `/` marketing-ish landing + “Start disclosure” CTA
- `/new` wizard flow
- `/d/[slug]` public disclosure page
- `/templates` browsing templates
- `/verify` verify bundle/receipt (optional)

---

## 2) Core Flow Components

### 2.1 `Wizard`
A stepper + router for the disclosure creation flow.

**Steps (MVP)**
1. Choose template
2. Project info
3. Human proof
4. AI usage
5. Timestamp (optional)
6. Preview & export
7. Publish (optional)

**Props**
```ts
type WizardProps = {
  templates: TemplateSummary[];
  initialTemplateSlug?: string;
};
```

**Behavior**
- autosave draft in `localStorage` (client-only)
- show “Local-only” badge until publish step
- allow back/forward navigation without losing files (keep in memory; warn on reload)

---

### 2.2 `TemplatePicker`
**Purpose:** choose use case template.

**UI**
- grid of template cards with icon + example
- “Recommended fields” preview
- “Why this matters” tiny callout

**Props**
```ts
type TemplatePickerProps = {
  templates: TemplateSummary[];
  onSelect: (slug: string) => void;
};
```

---

### 2.3 `ProjectInfoForm`
**Fields**
- Title (required)
- Author (optional)
- Links (repo URL, article URL, etc.)
- Audience (optional select)

**Behavior**
- validate URLs
- show “This will be public if you publish” warning banner

---

### 2.4 `ProofLedger`
A ledger-like list of proof items, with local hashing status and privacy flags.

**Subcomponents**
- `ProofUploader`
- `ProofItemRow`
- `HashStatusBadge`
- `PIIWarningBanner` (if detected)
- `ProofTips` (template-specific guidance)

**Props**
```ts
type ProofItem = {
  id: string;
  label: string;
  mime: string;
  sizeBytes: number;
  localOnly: true; // MVP: always true
  sha256?: string; // computed locally
  addedAtISO: string;
  createdBeforeAi: boolean;
};
type ProofLedgerProps = {
  items: ProofItem[];
  onAddFiles: (files: File[]) => void;
  onEdit: (id: string, patch: Partial<ProofItem>) => void;
  onRemove: (id: string) => void;
};
```

**Behavior**
- hashing starts immediately after add (WebCrypto)
- large files hash in a Web Worker if available
- show progress per file
- if user tries to publish with zero proof items, warn (allowed but discouraged)

**Privacy UI**
- persistent badge: “Proof stays on your device”
- publish step reiterates that only hashes get uploaded

---

### 2.5 `AssistanceMeter`
The signature disclosure UI: human↔AI split plus per-stage grades.

**MVP UI**
- A big **Split Bar**:
  - left: Human %
  - right: AI %
  - draggable handle
- Toggle: “Advanced: per-stage breakdown”

**Per-stage UI**
- Stages depend on template
- Each stage uses a 5-level grade selector (chips)
- Show computed approx % per stage in small text

**Props**
```ts
type AssistanceGrade = "none"|"light"|"moderate"|"heavy"|"full";
type Stage = { key: string; label: string; description?: string };

type AssistanceMeterProps = {
  global: { human: number; ai: number }; // sums to 100
  stages: Stage[];
  stageGrades: Record<string, AssistanceGrade>;
  onChangeGlobal: (v: { human: number; ai: number }) => void;
  onChangeStage: (key: string, grade: AssistanceGrade) => void;
};
```

**Behavior rules**
- sum must always be 100
- show “self-reported” stamp
- if template requires per-stage, prevent skipping (or auto-fill default grades)

---

### 2.6 `AiToolsForm`
Optional but encouraged.

**Fields**
- Tools used (multi-add list): product name, model (optional), provider (optional)
- “What did AI do?” checklist (template-specific)
- Freeform notes (short)

---

### 2.7 `TimestampStep`
Optional but strongly recommended.

**UI**
- explanation card: “What OpenTimestamps proves”
- toggle: “Create timestamp receipt (.ots) for this bundle”
- status area: `Not started → Stamping → Receipt created (Pending) → Upgraded (Complete)`
- button: `Stamp now`
- button (later): `Upgrade receipt`

**Props**
```ts
type TimestampStepProps = {
  enabled: boolean;
  status: "idle"|"stamping"|"pending"|"complete"|"error";
  rootHash?: string;
  receiptBytes?: Uint8Array;
  onStamp: () => Promise<void>;
  onUpgrade?: () => Promise<void>;
};
```

**Behavior**
- compute root hash locally (Merkle root of file hashes + manifest hash)
- stamp only the digest (never upload file data)
- store `.ots` receipt locally in the draft and include in export bundle

---

### 2.8 `DisclosurePreview`
The “official-looking” disclosure card.

Contains:
- project title + author
- template label
- assistance meter summary (global + per-stage compact)
- proof count + root hash
- timestamp seal status
- “self-reported” + “timestamped” stamps
- link to download bundle

---

### 2.9 `ExportPanel`
- download bundle zip
- download `disclosure.json`
- copy root hash
- copy “Disclosure summary” text for a blog footer

---

### 2.10 `PublishPanel`
**Warning:** publishing makes parts public.

Options:
- Publish **manifest + hashes** (default)
- Publish OTS receipt (recommended)
- Never publish raw proof files (MVP: not supported)

Shows:
- public URL preview
- `Publish` button + spinner
- post-publish: show link and QR code (optional later)

---

## 3) Public Disclosure Page (`/d/[slug]`)

### 3.1 Components
- `PublicDisclosureHeader`
- `DisclosureCard`
- `ProofHashTable` (hashes only)
- `TimestampReceiptPanel` (download `.ots`)
- `VerificationHints` (how to verify with CLI)

### 3.2 Tone
- neutral and factual
- emphasize: “self-reported” + “timestamped digest”

---

## 4) UI Primitives

- `Button` (primary/secondary/ghost)
- `Card` (paper surface + heavy border)
- `Stamp` (SVG overlay: self-reported / timestamped)
- `Badge` (hash status, local-only)
- `StepIndicator` (wizard progress)
- `FileDropzone`
- `Table` (ledger vibe)

A11y:
- file upload has clear instructions + keyboard support
- all stamps/badges have screen reader labels

---

## 5) Done Definition (Web MVP)
- user can complete flow without reading docs
- bundle export works offline after page load
- hash + timestamp operations provide visible progress and clear error states
- public page renders fast and is shareable
