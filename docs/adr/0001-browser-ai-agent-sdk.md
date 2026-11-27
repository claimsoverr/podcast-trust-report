# 0001. Use Vercel AI SDK for Client-Side Agent Execution

Date: 2026-11-27

## Status

Accepted

## Context

The application must run strictly in the browser with no backend server, Mastra Studio, or persistent memory. It needs to support user-configured **AI Connections** across local servers (LM Studio Bionic, LM Studio, Ollama, or any OpenAI-compatible `/v1` endpoint) and direct browser cloud APIs (Google Gemini, Claude, OpenAI) with streaming responses and multi-step tool calling.

## Decision

Use the Vercel AI SDK (`ai`, `zod`) directly in the browser (`src/utils/agent.ts`) via `streamText`, typed tool definitions, and `stopWhen`, paired with first-party provider adapters:

- `@ai-sdk/openai-compatible` for custom OpenAI-compatible endpoints and Ollama (`/v1`).
- `@ai-sdk/google` for Google Gemini.
- `@ai-sdk/anthropic` (sending `anthropic-dangerous-direct-browser-access: true` for user-supplied BYOK keys) for Claude.
- `@ai-sdk/openai` for OpenAI.

## Consequences

- **Easier:** Smaller, browser-native dependency surface; uniform multi-provider streaming and tool calling; direct support for both private local servers and cloud BYOK providers; straightforward integration with OpenUI streaming in upcoming steps.
- **Harder:** No built-in server orchestration or persistent memory out of the box—if needed later, state or memory must be implemented client-side; local servers require CORS enabled for the app origin.
