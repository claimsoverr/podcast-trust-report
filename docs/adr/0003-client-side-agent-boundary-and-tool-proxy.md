# 0003. Client-Side Agent Boundary, CORS Tool Proxy, and Separated Settings

Date: 2026-11-27

## Status

Accepted

## Context

Running YouTube metadata, transcript, and web-search agent workflows inside a strictly client-side React app introduces three architectural constraints:

1. **Agent vs. web app isolation** — The previous `src/utils/agent.ts` module imported settings types and helpers from the UI utility layer, coupling prompt/tool execution to browser storage concepts.
2. **Browser CORS restrictions** — YouTube InnerTube/caption endpoints and Exa (`api.exa.ai`) reject direct cross-origin browser requests, yet the app must remain static with zero backend server.
3. **Provider-specific tool capabilities** — Cloud providers (Google Gemini, Claude, OpenAI) include built-in web search without requiring a separate key or CORS proxy, whereas local providers (`openai-compatible`, `ollama`) rely on an optional external tool such as Exa. Within **AI Settings**, shared runtime configuration (**General**, such as the CORS proxy URL) should stay separate from **AI Connections**, while tool toggles and Exa keys belong inside each **AI Connection**.

## Decision

1. **Self-contained `src/agent/` boundary:** All agent orchestration, prompts, provider model construction, YouTube data fetching (`youtubei.js/web.bundle` via `getBasicInfo(..., { client: "ANDROID" })` and `json3` captions), and optional Exa web search live under `src/agent/` as pure TypeScript with zero React, DOM, `localStorage`, or UI utility imports. The web app passes plain config objects, `AbortSignal`, and progress/text callbacks across this one-way boundary.
2. **Hybrid execution pipeline with provider-native cloud search:** `runTrustReport` deterministically fetches Episode metadata and timestamped Transcript first, then runs Vercel AI SDK `streamText`. When Web Search is enabled on the active **AI Connection**, cloud providers attach their built-in search tool (`google_search` via `google.tools.googleSearch`, Anthropic `web_search` via `webSearch_20250305`, or OpenAI `web_search` via `openai.tools.webSearch`) directly—no Exa key or proxy needed—while local providers attach the optional Exa `webSearch` tool when an Exa API key is provided.
3. **User-configured CORS proxy + dev fallback:** Browser fetches for YouTube (and local Exa search) in `src/agent/` route through a user-configured `corsProxyUrl` stored in **AI Settings → General**. In local development (`npm run dev`), a dev-only Vite middleware at `/cors-proxy?url=` acts as an automatic fallback when `corsProxyUrl` is left blank, keeping production `dist/` 100% static.
4. **AI Settings organization:** `SettingsDrawer` handles **AI Settings** with two stacked sections (**General** above **Connections**) backed by separate stores: `src/utils/aiGeneralSettings.ts` (`podcast-trust-report:ai-general-settings`) and `src/utils/settings.ts` (`podcast-trust-report:ai-settings`, where each **AI Connection** stores its own `tools.webSearch` config—enabled by default for cloud, optional with Exa key for local).

## Consequences

- **Easier:** Cloud users get built-in web search out of the box with zero extra keys or proxy traffic for search; local model users can opt into Exa per connection; shared **General** settings stay cleanly separated from **Connections**; the agent core stays decoupled from React.
- **Harder:** Production static deployments (such as GitHub Pages) still require a CORS proxy URL in **AI Settings → General** to fetch YouTube Episode transcripts; bundling `youtubei.js/web.bundle` increases client bundle size.
