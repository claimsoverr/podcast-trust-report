# Podcast Trust Report

A privacy-first tool that turns any YouTube podcast link into an interactive trustworthiness report.

## How It Works

1. **Configure your AI** — Provide an API key, custom API URL, or local AI model in settings.
2. **Paste a YouTube link** — The app transcribes and analyzes the episode.
3. **Review the report** — Explore an interactive visual report generated directly from the episode.

## What's in the Report

- **Summary** — Concise overview of the episode.
- **Chapters** — Timestamped breakdown of topics.
- **Fact-Checked Claims** — Key claims evaluated for accuracy.
- **Guest Trustworthiness** — Credibility signals and reasons to trust (or question) the guest and host, alongside an overall trustworthiness score.

## Privacy

Everything runs in your browser with no backend server. Your API keys and settings stay local and are sent only to the AI provider or local model you configure.

## Tech Stack

- **UI:** React, TypeScript, Vite
- **AI Agent:** Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`, `zod`) running client-side
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
