# 0002. Use Vanilla Modern CSS (Baseline 2026) and CSS Modules

Date: 2026-11-27

## Status

Accepted

## Context

We want a minimal, low-dependency, standards-first styling architecture for React components without utility-framework overhead or third-party UI libraries.

## Decision

Target Baseline 2026 vanilla HTML/CSS (custom properties, `@layer`, `display: grid`, `light-dark()`, native `<dialog>` and `popover`) with locally scoped CSS Modules (`*.module.css`) organized in a component-per-folder layout (`src/components/<Name>/`). Define global design tokens and cascade layers in `src/styles/`, and do not add CSS frameworks (e.g., Tailwind or DaisyUI).

## Consequences

- **Easier:** Zero-runtime styling, predictable cascade ordering via `@layer`, native browser accessibility for modal and popover primitives, and minimal dependency churn.
- **Harder:** Requires writing explicit component CSS instead of utility classes, and OpenUI components added later will need explicit CSS Module styling rather than prebuilt theme classes.
