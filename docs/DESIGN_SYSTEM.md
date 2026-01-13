# Disclose — Design System (Tailwind Tokens)

Design direction: **Notary Pop**  
Think: “paper + ink + stamps,” but with a modern friendly vibe.

This system is built with **CSS variables + Tailwind** so you can theme (including dark mode) easily.

---

## 1) Design DNA

### Surfaces
- Paper background, slightly warm
- “Card” surfaces are white paper with visible ink border
- Use “ledger lines” sparingly as subtle textures

### Borders
- Strong border width: 3px
- Inputs: 2px
- Dividers: 1px (rare)

### Shadows
Hard-offset shadows (no blur) to keep the “physical paperwork” vibe.

### Stamps/Seals
Two “truth stamps” appear often:
- **SELF‑REPORTED**
- **TIMESTAMPED (.ots)**

Use stamps to communicate trust level without being preachy.

---

## 2) Color Tokens

Neutrals:
- background: warm paper
- foreground: near-black ink
- muted: gray ink
- border: ink

Accents:
- notary blue (primary CTA)
- seal red (stamp / warnings)
- gold highlight (emphasis)
- trust green (success)

Zones (assistance / warnings):
- `low` / `medium` / `high` usage bands (optional)

---

## 3) Typography Tokens

Recommended fonts:
- Sans: `Space Grotesk` (friendly, official-ish)
- Mono: `IBM Plex Mono` (hashes, digests)

Type scale:
- Display: `text-5xl sm:text-6xl font-black tracking-tight`
- H1: `text-4xl sm:text-5xl font-black tracking-tight`
- H2: `text-2xl sm:text-3xl font-extrabold tracking-tight`
- H3: `text-xl font-extrabold`
- Body: `text-base leading-7`
- Small: `text-sm leading-6`
- Micro label: `text-xs uppercase tracking-widest`

---

## 4) Tailwind Token Wiring

- `tailwind.config.ts` maps Tailwind colors to CSS variables like `rgb(var(--accent))`
- `globals.css` defines tokens and a few “brand primitives”:
  - `.dc-card`
  - `.dc-button`
  - `.dc-input`
  - `.dc-stamp`

---

## 5) Accessibility
- Maintain contrast across stamps and badges
- Focus rings always visible
- Reduce-motion support for step transitions

---

## 6) Included Files
- `apps/web/tailwind.config.ts`
- `apps/web/app/globals.css`
- `shared/tokens/tokens.json`
- `public/assets/*.svg`
