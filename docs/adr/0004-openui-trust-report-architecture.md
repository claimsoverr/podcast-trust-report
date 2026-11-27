# 0004. OpenUI Trust Report Architecture

Date: 2026-11-27

## Status

Accepted

## Context

Previously, `runTrustReport` streamed plain text directly into a `<output>` monospace block. Turning a YouTube podcast Episode into a structured **Trust Report** (Summary, Chapters, Fact-Checked Claims, Guest Trustworthiness, and Trustworthiness Score) requires rich, scannable, interactive UI generated directly by the configured AI model while preserving three existing invariants:

1. **Pure agent core ([ADR 0003](0003-client-side-agent-boundary-and-tool-proxy.md))** — `src/agent/` must stay decoupled from React, DOM APIs, and UI libraries.
2. **OpenUI-free UI primitives ([ADR 0002](0002-vanilla-modern-css-and-css-modules.md))** — `src/components/ui/` holds generic, reusable Vanilla CSS Module primitives that should not depend on OpenUI schemas or runtime.
3. **Reliability across cloud and local models** — Users run both frontier cloud models and smaller local models (LM Studio, Ollama), so generated OpenUI syntax must be tightly constrained and resilient to accidental markdown fencing or malformed output.

## Decision

1. **Isolated `src/openui/` layer:** All `@openuidev/react-lang` imports (`defineComponent`, `createLibrary`, compiled system prompt, `<TrustReportRenderer />`, URL sanitization, and fence stripping) live exclusively inside `src/openui/`.
   - `src/components/ui/` stays 100% OpenUI-free (`Badge`, `Meter`, `Stat`, `Disclosure`, `Timeline`, plus existing `Alert`, `Card`, `Flex`, `Skeleton`).
   - `src/agent/` stays 100% OpenUI-free; `src/App.tsx` passes the compiled `TRUST_REPORT_UI_PROMPT` string into `runTrustReport` via `uiSystemPrompt`.
2. **Domain-focused OpenUI component catalog:** Instead of generic layout primitives, the OpenUI library defines Trust Report domain components (`TrustReport` root, `Notice`, `EpisodeSummary`, `TrustScore`, `ChapterList`/`ChapterItem`, `ClaimList`/`ClaimCard`, `TrustSignals`/`SignalItem`) composed on top of `src/components/ui/` primitives.
3. **Resilient streaming, sanitization, and fallback:**
   - `<TrustReportRenderer />` strips accidental leading/trailing markdown code fences before passing streamed output to OpenUI `<Renderer isStreaming={...} />`.
   - All URL props (YouTube timestamp links and Claim source links) are sanitized via `new URL(...)` to allow only `http:` and `https:` protocols before rendering `<a>` tags.
   - If the completed response fails to produce a valid OpenUI `root` (or throws during render), `<TrustReportRenderer />` displays a warning `Alert` alongside the raw model text so the analysis is never lost.

## Consequences

- **Easier:** UI primitives remain reusable outside OpenUI, the agent stays framework-agnostic, local models produce much higher validity against domain schemas with positional args, and malformed model outputs degrade gracefully instead of failing silently.
- **Harder:** Adding new report sections requires updating both the domain catalog in `src/openui/` and the prompt guidance in `src/agent/prompt.ts`.
