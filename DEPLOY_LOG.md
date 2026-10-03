# Rayality Mapping Pro — Deployment Log

## 2026-05-27 (TPE) — Initial production deployment

- **Production URL:** https://rayality-mapping-pro.vercel.app
- **Vercel project:** `allcarerickray-7044s-projects/rayality-mapping-pro`
- **Deployment ID:** `dpl_D8fGRZQqWiuko5Xp3ReRdABDqYdj`
- **Inspector:** https://vercel.com/allcarerickray-7044s-projects/rayality-mapping-pro/D8fGRZQqWiuko5Xp3ReRdABDqYdj
- **Node version:** v25.6.1 (local build), Vercel builder used `vercel build` with Vite 6
- **Build time:** ~16s on Vercel (1s locally)
- **Framework:** auto-detected as Vite ✅
- **GitHub:** repo `rick-ray-wldd/rayality-mapping-pro` connected via `vercel link`

### Functional checklist (stage 2.6)

| Item | Result |
|---|---|
| Page loads (HTTP 200, HTML + Vite bundle served) | ✅ verified via `curl` |
| Dark theme renders, header / Surfaces panel visible | ✅ verified via Playwright snapshot |
| "Add Quad" dropdown opens, all 4 shape presets present | ✅ |
| Add 16:9 Quad → `Quad 1` appears in Surfaces panel (editable label) | ✅ |
| Screenshot saved | ✅ `evidence/screenshots/prod_20260527.png` |
| Media upload → assign to surface | ⏳ **needs human verification** (Playwright can't easily simulate the file picker UX without a fixture) |
| AI panel → paste Gemini key → Veo generation | ⏳ **needs human verification** with a Gemini key that has paid billing (Veo is not on free tier) |
| Floating Window (PiP) sync across windows | ⏳ **needs human verification** (Chrome/Edge only, requires real user interaction) |

### Security gate (stage 2.4) — passed

- `vercel env ls` returned **no environment variables** for the project. `GEMINI_API_KEY` is **not** set on Vercel, so the BYOK design is preserved (users paste their own key into the UI → stored in localStorage). No personal Gemini key was leaked into the production bundle.

### Console warnings on production (non-blocking)

- `404 favicon.ico` — no favicon shipped. Cosmetic only.
- `404 /Rayality_logo.png` — the header `<img>` element references the logo PNG that sits at repo root but is **not** in `public/` or imported by Vite, so it's not in the build output. Header text still renders ("Rayality Mapping Pro" heading + img alt text "Rayality"). Cosmetic only; not in scope for the deploy task.
- 1 console warning from Tailwind CDN ("should not be used in production") — known and intentional per `CLAUDE.md` §3.5.

### Files changed

- `Readme.md` — added Live Demo line at the top.
- `CV.tex` (at an external résumé file) — appended Live Demo link next to the existing GitHub link in the "Rayality Mapping Pro" entry.
- `DEPLOY_LOG.md` — this file.
- `evidence/screenshots/prod_20260527.png` — full-page screenshot of production after creating Quad 1.

### Git

- README change committed and pushed to `origin/main` (see next commit hash).

### Suggested next steps

1. Human-driven end-to-end test with a real paid-billing Gemini key: Media upload, Veo text-to-video, and PiP floating-window sync.
2. Optional: fix the two 404s by moving `Rayality_logo.png` into `public/` and adding a `favicon.ico` (cosmetic).
3. Optional: bind a custom domain.
4. Optional: upgrade Vercel CLI 50.44.0 → 54.4.1 (Vercel's builder already used 54.4.1 server-side; only the local CLI is older).

---

## 2026-05-27 (TPE) — Veo model tier selector

- **Deployment ID:** `dpl_EXRWL5ctS58eJPJVS7LC3rNFX2g6`
- **URL (alias):** https://rayality-mapping-pro.vercel.app
- **Build time:** ~12s on Vercel

### What changed

- `constants.ts`: replaced the single hard-coded `VEO_MODEL` with a `VEO_MODELS` list of three verified Gemini API model IDs and a `DEFAULT_VEO_MODEL_ID`.
  - `veo-3.1-lite-generate-preview` (Lite, ~$0.24 / 8s clip)
  - `veo-3.1-fast-generate-preview` (Fast, ~$1.20 / 8s clip — **default**)
  - `veo-3.1-generate-preview` (Quality, ~$3.20 / 8s clip)
  - All three IDs verified against `ai.google.dev/gemini-api/docs/models/veo-3.1-*`.
- `components/VeoPanel.tsx`: added `veoModelId` state initialised from `localStorage` (key `rayality_veo_model`), passed into both `ai.models.generateVideos` calls, and rendered a 3-tier segmented selector above the Aspect Ratio section.

### Why

- Veo 4 isn't yet on the Gemini Developer API (only Google Flow + Gemini Ultra), so switching to "the latest" model isn't possible. Within the Veo 3.1 family, the previous fixed Quality choice cost ~4× Fast and ~13× Lite per clip, with most of that detail being lost once the texture is corner-pinned, blended (Screen/Multiply/Overlay), and projected. Letting users pick per generation matches the iteration-heavy nature of texture authoring.

### Verified via Playwright

- ✅ Production URL loads (HTTP 200, no console errors after favicon/logo cache)
- ✅ AI Texture Lab panel renders new "Model Tier" section with 3 buttons + cost labels + helper text
- ✅ Default state is Fast (no `localStorage` entry → falls back to `DEFAULT_VEO_MODEL_ID`)
- ✅ Clicking Quality writes `veo-3.1-generate-preview` into `localStorage.rayality_veo_model`
- ✅ TypeScript: `npx tsc --noEmit` passes
- ✅ Local build: `dist/assets/index-A-Qjcu3l.js` 550.74 KB / gzip 135.45 KB (≈ +1.8 KB vs previous)

### Still requires human verification with a real paid Gemini key

- That each of the three model IDs actually accepts the `generateVideos` request (model IDs are documented but were not exercised in this session).
- End-to-end: prompt → operation poll → video URI fetch → asset added.

### Suggested follow-ups

1. When Veo 4 lands on the Gemini Developer API, add it to `VEO_MODELS` (one-line change).
2. Optional: show a faint "$~est" disclaimer somewhere persistent — currently only inside the section's helper text.


## 2026-10-03 — 0.1.0 productization

- Removed build-time Gemini key substitution; fake-key bundle regression now passes.
  The previous production JS and tracked history had no Google key-pattern match.
- Added portable projects with embedded media, visible save status, upload error
  handling, live geometry sync, aspect-correct output/PiP stage and storage fallback.
- Built Tailwind locally, bundled the logo, replaced remote patterns, added original
  calibration assets, bilingual guide, privacy/about pages and MIT/third-party notices.
- Clean `npm ci`, `tsc --noEmit`/production build and five Playwright integration
  tests passed on isolated Chromium. Tests include real corner drag, image/video
  persistence, output scaling/sync, invalid import preservation and ads disabled.
- Installed Chrome video-output validation timed out; isolated Chromium passed.
  Real projector/PiP and paid Veo remain unverified; no paid model calls were made.
- Production npm audit: 0 findings. Five development-only Tailwind3 glob/brace
  findings remain; see docs/RELEASING.md. Main JS is ~558 KB / 138 KB gzip.
- AdSense scaffold is disabled and guide-only. No publisher ID, approval or revenue.
  Existing Vercel team verified as Hobby with no environment variables. Monetization
  requires a suitable host/domain and owner account/CMP/payment setup.
- Local evidence: evidence/screenshots/editor_20261003.png and output_20261003.png.

### Production verification

- Source deployment commit: `3ebefb7` (application code: `0e314ba`).
- Deployment: `dpl_7myPnvEQiF6SAbUdUYMpNYF4X51g`.
- Alias: https://rayality-mapping-pro.vercel.app
- Inspector: https://vercel.com/allcarerickray-7044s-projects/rayality-mapping-pro/7myPnvEQiF6SAbUdUYMpNYF4X51g
- Initial CLI deployment failed because the include-only ignore rules omitted
  component directories. Explicit private-file exclusions fixed the upload;
  the next deployment completed successfully without changing application code.
- Anonymous HTTPS 200: editor, guide, privacy, about, favicon, both samples,
  third-party notice and disabled ad configuration.
- Served `/assets/index-CcaRiAwO.js` exactly matches the local build; SHA-256:
  `590361e83e11cfd4ef9415ba2512e24993908d69bbcae1cbb85bf6880190b00d`.
- All five integration tests passed again against the public alias in a fresh
  Chromium context (3.0 minutes). No paid API requests or account login used.
- Production screenshots: `evidence/screenshots/editor_production_20261003.png`
  and `evidence/screenshots/output_production_20261003.png`.
- Static release ZIP: 20 public files, 371577 bytes; SHA-256:
  `ac30bd01105c700904645efbcfa90c97a20ee0d0372fc73bc11cb3ad29d70531`.
- Advertising remains off. This deployment is the ad-free open-source tool;
  monetization prerequisites remain listed in docs/MONETIZATION.md.
