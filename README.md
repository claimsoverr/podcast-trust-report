# Podcast Trust Report

A privacy-first tool that turns any YouTube podcast link into an interactive trustworthiness report.

## Getting Started

Running the project locally is currently the recommended way to use the app—the Vite dev server includes a built-in CORS proxy for fetching YouTube Episode metadata and Transcripts with no extra setup.

Requires Node.js and npm:

```sh
git clone https://github.com/claimsoverr/podcast-trust-report.git
cd podcast-trust-report
npm install
npm run dev
```

Open the local URL printed in your terminal (for example, `http://localhost:5173/podcast-trust-report/`), then open **Settings** to add an **AI Connection**.

## How It Works

1. **Configure your AI** — Create one or more **AI Connections** in Settings using a local model (such as LM Studio Bionic or Ollama) or a cloud API key (Google Gemini, Claude, OpenAI).
2. **Paste a YouTube link** — The app transcribes and analyzes the episode.
3. **Review the report** — Explore an interactive visual report generated directly from the episode.

## What's in the Report

- **Summary** — Concise overview of the episode.
- **Chapters** — Timestamped breakdown of topics.
- **Fact-Checked Claims** — Key claims attributed by speaker (Host or Guest) and evaluated for accuracy.
- **Host & Guest Trustworthiness** — Separate trustworthiness scores, context, and evidence-backed signals for the Host / Podcast and the Guest(s), alongside an overall Episode trustworthiness score.

## Privacy

Everything runs in your browser with no backend server. Your API keys and settings stay local and are sent only to the AI provider or local model you configure.

## Tech Stack

- **UI:** React, TypeScript, Vite
- **Generated UI:** OpenUI (`@openuidev/react-lang`, `@openuidev/lang-core`)
- **AI Agent:** Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/anthropic`, `zod`) running client-side
- **Styling:** Vanilla modern CSS (Baseline 2026) and CSS Modules
- **Linting:** `oxlint`

## Development

```sh
npm install
npm run dev      # Start local dev server
npm run build    # Type-check and build production bundle
npm run lint     # Run oxlint
npm run preview  # Preview production build
```
