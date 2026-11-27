# AGENTS.md

For product scope and features, see [README.md](README.md).

## Core Invariants

- **Client-side only** — No backend server. User settings, API keys, and requests stay in the browser and go only to the AI provider or local model configured by the user.
- **Bring your own AI** — Support user-configured API keys, custom API URLs, and local AI models.
- **Generated UI** — Render reports using OpenUI.

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
