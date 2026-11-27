# AGENTS.md

For product scope and features, see [README.md](README.md).

## Core Invariants

- **Client-side only** — No backend server. User settings, API keys, and requests stay in the browser and go only to the AI provider or local model configured by the user.
- **Bring your own AI** — Support user-configured API keys, custom API URLs, and local AI models.
- **Generated UI** — Render reports using OpenUI.

## Frontend Conventions

- **Vanilla modern HTML/CSS (Baseline 2026)** — Prefer native HTML primitives (`<dialog>`, `popover`, semantic elements) and modern CSS (custom properties, `@layer`, `display: grid`, `@container` queries, fluid `clamp()` sizing, `light-dark()`). Avoid CSS frameworks; see [ADR 0002](docs/adr/0002-vanilla-modern-css-and-css-modules.md).
- **Component-per-folder & CSS Modules** — Place reusable UI primitives in `src/components/ui/<Name>/` (re-exported from `src/components/ui/index.ts`) and feature components in `src/components/<Name>/`, each with locally scoped `*.module.css` styles. Prefer `Skeleton` for content/report loading states, reserving `Spinner` for inline button loading.
- **Import aliases** — Use `@/*` (mapped to `src/*`) for cross-directory imports.

## Visual Design

- **Design tokens** — [src/styles/tokens.css](src/styles/tokens.css) is the single source of truth for all token values; never hardcode colors, spacing, radii, or font stacks in component CSS.
- **Look & feel** — Crisp analytical utility: structured, minimalist tool UI with neutral chrome and tight hierarchy.
- **Color & theme** — Equal-priority light and dark modes (system default, overridable in `Settings`); neutral layered surfaces, one restrained accent for interactive actions, and semantic status tones reserved strictly for `Trust Report` verdicts, `Trustworthiness Score`, and errors.
- **Typography** — Native system sans-serif for UI and reading; monospace with tabular numerals for `Chapter` timestamps, `Trustworthiness Score`, and technical fields. No web fonts.
- **Layout & surfaces** — Fluid, mobile-friendly design without viewport width breakpoints (`@media (min-width / max-width)`): adapt using intrinsic CSS Grid/Flexbox (`auto-fit`/`minmax()`), fluid `clamp()` sizing, and `@container` queries, with touch-friendly tap targets (`@media (pointer: coarse)`) and zero horizontal overflow. Scales to a centered reading-width column with comfortable-compact density and flat layered surfaces separated by crisp borders (avoid drop shadows and decorative gradients).
- **Trust Report & accessibility** — Calm, objective, evidence-first presentation; never convey meaning by color alone (always pair semantic color with explicit labels). Preserve visible keyboard focus and keep motion minimal, respecting `prefers-reduced-motion`.

## Agent Persona & Workflow

- **Style** — Direct, concise, zero conversational filler. Explain the "why" and trade-offs behind non-obvious technical decisions in 1–3 short bullets.
- **Design philosophy** — Simple, explicit, readable code over clever abstractions (KISS, YAGNI). Minimize repetition in both code and docs: reuse existing helpers and patterns before introducing new ones, and extract shared utilities only when a pattern genuinely repeats.
- **Durable docs** — Document boundaries, invariants, and the "why". Avoid repeating volatile details already defined in code or config (package versions, config flags, exhaustive file lists). Point to the owning file or directory when a reference helps.
- **Step-by-step execution:**
  1. **Inspect (read-only)** — Read relevant files first so the plan fits the existing codebase.
  2. **Plan & teach** — Present a short plan for the current step, explain key trade-offs, highlight decisions for the user, and **stop for explicit confirmation before creating or modifying any files, installing packages, or committing**.
  3. **Execute & verify** — After confirmation, apply the changes and verify them before moving to the next step.

## Documentation

- **Glossary** — Use canonical domain terms from [GLOSSARY.md](GLOSSARY.md); update it when introducing new core concepts.
- **ADRs** — Record significant architectural decisions in `docs/adr/` before or alongside implementation.
