import type { EpisodeMetadata, EpisodeTranscript } from "./types";

const MAX_DESCRIPTION_CHARS = 2000;

export function buildSystemPrompt(options: {
  webSearchEnabled: boolean;
}): string {
  const { webSearchEnabled } = options;

  const factCheckInstructions = webSearchEnabled
    ? `## Fact-Checking & Web Verification
- Extract the strongest, verifiable factual Claims made in the Episode.
- Use your web search tool to verify major Claims against reputable external sources and to check Guest/Host background and potential conflicts of interest.
- Keep searches focused (2-6 targeted queries total) rather than searching minor details.
- For each Claim include:
  - The Claim summary and exact [MM:SS] (or [HH:MM:SS]) timestamp plus clickable link https://youtube.com/watch?v=VIDEO_ID&t=XXs (where XX is seconds).
  - Verdict (e.g. Supported / Partially Supported / Unsupported / Disputed / Unverifiable) and Confidence (0-100%).
  - Concise reasoning and the source URLs returned by web search.`
    : `## Fact-Checking (Web Search Disabled)
- Web search is disabled for this run.
- Extract the strongest factual Claims made in the Episode with their exact [MM:SS] (or [HH:MM:SS]) timestamps and watch links https://youtube.com/watch?v=VIDEO_ID&t=XXs.
- Explicitly state that Claims were NOT verified against live web sources in this run.
- Do NOT fabricate external URLs or pretend to have checked live sources; instead, note clearly what is stated in the Transcript, any obvious internal inconsistencies or hedging, and what external evidence would verify each Claim.`;

  return `You are an objective, evidence-first podcast analyst producing a Trust Report for a YouTube Episode.

Write a clear, concise plain-text Trust Report using only facts observed in the provided Episode metadata, Transcript${webSearchEnabled ? ", and web search results" : ""}. Never invent timestamps, quotes, or source URLs.

## Required Structure
Organize the output into these four sections in order:

1. SUMMARY
- Concise overview of the Episode, identifying the Podcast, Host(s), and Guest(s) when mentioned, plus the central topics and timestamp ranges.

2. CHAPTERS
- Logical topic breakdown with start timestamps in YouTube format (start with 0:00, one chapter per line, descriptive Title Case titles, 5-15 chapters depending on Episode length).

3. FACT-CHECKED CLAIMS
${factCheckInstructions}

4. GUEST TRUSTWORTHINESS
- Evaluate the Guest's (and Host's, where relevant) Trustworthiness signals based on evidence: transparency, precision vs. overclaiming, citation of evidence, relevant expertise, and any verified background/conflict-of-interest signals.
- Never convey judgment with vague labels alone; tie each point to specific timestamps or verified findings.
- End with: Trustworthiness Score: XX/100 followed by a 1-2 sentence rationale.

Keep the tone calm, neutral, analytical, and concise.`;
}

export function buildEpisodePrompt(
  metadata: EpisodeMetadata,
  transcript: EpisodeTranscript,
): string {
  const description = metadata.description.trim();
  const trimmedDescription =
    description.length > MAX_DESCRIPTION_CHARS
      ? `${description.slice(0, MAX_DESCRIPTION_CHARS)}... [truncated]`
      : description;

  return [
    "Generate a Trust Report for the following YouTube Podcast Episode.",
    "",
    "## Episode Metadata",
    `- Video ID: ${metadata.videoId}`,
    `- Title: ${metadata.title || "Unknown"}`,
    `- Podcast / Channel: ${metadata.author || "Unknown"}`,
    `- Duration: ${metadata.durationFormatted || transcript.durationFormatted}`,
    ...(trimmedDescription ? [`- Description:\n${trimmedDescription}`] : []),
    "",
    `## Timestamped Transcript (${transcript.segmentCount} segments)`,
    transcript.transcript,
  ].join("\n");
}
