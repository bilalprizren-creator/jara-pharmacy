# CLAUDE.md — Jara Pharmacy Web App

Guidance for Claude when working in this repo. The [README.md](README.md) covers the
full architecture; this file captures **how we actually work here, the design
patterns the maintainer likes, and the gotchas that have bitten us before.**

## What this is

A modern, premium, **bilingual (Albanian `al` / English `en`)** marketing/catalog
web app for **Jara Pharmacy** (Prizren, Kosovo). It is **inquiry-first**: there is
**no checkout**. Every product routes into a WhatsApp / phone / contact-form
inquiry. Albanian is the default language.

## Stack & commands

- **React 18 + TypeScript + Vite**, **Tailwind CSS** (design-token driven),
  **Framer Motion** (restrained), **lucide-react** icons, **react-hook-form + zod**.
- Path alias **`@/`** → `src/`.

```bash
npm run dev      # dev server (Claude launches it on port 5200 via .claude/launch.json)
npm run build    # tsc --noEmit && vite build  → /dist   (this is what Vercel runs)
npm run lint     # tsc --noEmit only  (the pre-commit hook runs this)
npm run preview  # preview the production build (port 5300)
```

There are **no unit tests**. Verification = `npm run lint` (types) + `npm run build`
+ eyeballing the dev server in the browser.

## Deploy

- Hosted on **Vercel**. Live site: **https://jara-pharmacy.vercel.app** — this is
  the real, canonical URL. Push to `main` → Vercel auto-deploys.
- ⚠️ **Domain gotcha:** `jarapharmacy.com` currently redirects to the **wrong**
  site (`shemofarm.com`). Do not treat `jarapharmacy.com` as the live app.
- A broken TypeScript build breaks the Vercel deploy. A **pre-commit hook**
  (`.claude/settings.json`) runs `tsc --noEmit` and blocks the commit if it fails,
  so keep the build green.

## Working across two PCs (important)

The maintainer works on **two computers**. **Git is the only sync mechanism** —
`git pull` at the start of a session, `git push` at the end. **Do NOT rely on
OneDrive / cloud-folder sync** for the project files: a stale OneDrive sync has
previously clobbered finished work (see commits `9382384`, `da46cab`). Keep the
working tree clean and pushed.

## How content is structured (edit data, not markup)

Almost all changes are **content/curation edits in `src/data/`**, not new
components. Key files:

- **`src/data/copy.ts`** — every visible UI string, keyed by locale (`al` / `en`).
  English is typed against the Albanian shape so keys can't drift. Add copy here.
- **Bilingual fields** everywhere use the shape `{ al: "…", en: "…" }` and are
  resolved at render via `useI18n().tr(value)`. Never hardcode user-facing text.
- **`src/data/products.ts`** + `src/data/imported/` — the SHEMO OTC catalog
  (~1,569 products). Products carry `category`, `form`, `palette`, `featured`, etc.
- **`src/data/homepage.ts`** — the homepage is **curated rows**, not the whole
  catalog. Rows reference products **by id or by category** (`homeSections`) —
  products are never duplicated, only referenced. `OFFER_IDS` is the promo row.
  Edit this to change what the homepage highlights.
- **`src/data/categories.ts`** — the catalog categories, each with a **lucide
  icon** + `accent` color + bilingual title/description.
- Other data: `locations.ts` (the **12 real branches** + map), `socials.ts`,
  `blog.ts`, `testimonials.ts`, `trust.ts`, `stats.ts`, `nav.ts`, `brand.ts`.

The `neon` MCP server is configured in `.mcp.json` but content is currently
**static TS files**, not a database. Don't assume a live backend.

## Design language the maintainer likes

Reuse these; they are the established look and have been praised explicitly:

- **Icons on everything** — `lucide-react`, one clear icon per category / feature.
- **Rounded, soft cards & pills** — `rounded-full` buttons and chips; cards use the
  radius scale (`rounded-lg/xl/2xl` = 20–28px) with the soft shadow tokens
  **`shadow-soft` / `shadow-card` / `shadow-lift`** (green-tinted). Prefer these
  over ad-hoc shadows.
- **The Jara header/navbar** (`components/navigation/Navbar.tsx`) — fixed, starts
  **transparent over the hero and turns solid white + `backdrop-blur` on scroll**,
  with a thin reading-progress bar and active-section highlighting. This pattern
  is a keeper; match it, don't replace it.
- **Brand palette** (`tailwind.config.js`): greens **`forest` #0A5C44**,
  `emerald2`, highlight **`lime` #B7E532**; **`rose`** for beauty/skincare accents;
  soft surfaces `surface-soft` / `surface-cream`. Category `accent` picks one of
  these tones.
- **`SectionHeading`** (eyebrow + title + subtitle) for every section header.
- **Horizontal carousels** (`components/ui/CardSlider.tsx`) with **soft fading
  edges + scroll arrows** for product/category rows.
- **Motion is restrained**: use the `Reveal` component and `@/lib/motion` presets;
  always honor `prefers-reduced-motion` (there's `useReducedMotion`).
- **WhatsApp-first CTAs** — the green WhatsApp button + labels like *"Porosit Tani"*
  / *"Pyet për këtë produkt"*. Build links with `@/lib/links`
  (`whatsappHref`, `telHref`, maps), never hand-rolled URLs.

Reusable primitives already exist in `components/ui/` (Button, Chip, Badge, Modal,
CardSlider, SectionHeading, Container, BrandLogo, ProductVisual…). **Check there
before building anything new.**

## Conventions

- Compose classes with **`cn()`** from `@/lib/cn` (clsx + tailwind-merge).
- Style with **Tailwind design tokens** (the colors/radii/shadows above), not raw
  hex or arbitrary values, so the look stays consistent.
- Match the surrounding file's style; keep components typed and accessible
  (labelled icon-only buttons, focus rings, semantic landmarks — see README a11y).
- Commit messages: short imperative subject describing the user-visible change
  (see `git log` — e.g. *"Fix homepage Vitamins & Health row…"*).

## Working with the maintainer

The maintainer communicates in **German** and is **non-technical** — reply in
German, explain plainly, and prefer doing the git/build/deploy steps rather than
handing over commands. Confirm before committing/pushing.
