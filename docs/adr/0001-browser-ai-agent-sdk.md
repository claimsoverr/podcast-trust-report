# 0001. Use Vercel AI SDK for Client-Side Agent Execution

Date: 2026-11-27

## Status

Accepted

## Context

The application must run strictly in the browser with no backend server, Mastra Studio, or persistent memory. It needs to support user-configured OpenAI-compatible API URLs, optional API keys, and local AI models with streaming responses and multi-step tool calling.

## Decision

Use the Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`, `zod`) directly in the browser (`src/utils/agent.ts`) via `streamText`, typed tool definitions, and `stopWhen`, rather than `@mastra/core/agent`.

## Consequences

- **Easier:** Smaller, browser-native dependency surface; direct support for OpenAI-compatible local and cloud endpoints; straightforward integration with OpenUI streaming in upcoming steps.
- **Harder:** No built-in server orchestration or persistent memory out of the box—if needed later, state or memory must be implemented client-side.
