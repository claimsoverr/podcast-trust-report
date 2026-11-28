import type { EpisodeMetadata, EpisodeTranscript } from "./types";

const MAX_DESCRIPTION_CHARS = 2000;

export function buildSystemPrompt(options: {
  webSearchEnabled: boolean;
  uiSystemPrompt?: string;
}): string {
  const { webSearchEnabled, uiSystemPrompt } = options;

  const factCheckInstructions = webSearchEnabled
    ? `## Fact-Checking & Web Verification
- Actively prioritize the most questionable, overstated, speculative, or potentially false/misleading assertions alongside key factual Claims—do NOT cherry-pick only safe or benign truisms.
- Use your web search tool to verify major Claims against reputable external sources and to check Guest/Host background, track record, and undisclosed conflicts of interest.
- Keep searches focused (2-6 targeted queries total) rather than searching minor details.
- For each Claim include:
  - Verdict (one of: Supported, Partially Supported, Speculation, Disputed, Unsupported, False / Misleading, Unverifiable).
  - Exact MM:SS (or HH:MM:SS) timestamp from the Transcript.
  - Concise Claim summary.
  - Critical, evidence-based reasoning noting missing caveats, counter-evidence, or overclaiming, plus verified source URLs returned by web search.`
    : `## Fact-Checking (Web Search Disabled)
- Web search is disabled for this run.
- Actively prioritize extracting the most questionable, overstated, speculative, or logically flawed assertions alongside key factual Claims—do NOT cherry-pick only safe truisms.
- Classify each Claim critically:
  - Use "Speculation" for opinions, predictions, anecdotes, or personal beliefs presented as certainty or universal rules.
  - Use "False / Misleading" when an assertion is demonstrably false, logically self-contradictory, or an overstated absolute (e.g. "always", "never", "the only...") that ignores obvious counterexamples.
  - Use "Unverifiable" for vague or unfalsifiable assertions.
  - Reserve "Not Verified" for concrete empirical claims that require live web lookup.
- Include exact MM:SS (or HH:MM:SS) timestamps from the Transcript.
- Include a warning Notice explaining that live web verification was disabled for this run.
- Do NOT fabricate external URLs or pretend to have checked live sources; instead, note clearly in reasoning what is stated in the Transcript, any logical flaws, overclaiming, or missing caveats, and what external evidence would verify or refute each Claim.`;

  const scoringRubric = `## Trustworthiness Score Rubric (0-100)
Be strict and calibrated—do NOT give famous guests or hosts the benefit of the doubt or default to high scores:
- 80-100 (High): Verified factual accuracy, explicit citations/caveats, transparent disclosure of conflicts/incentives, minimal speculation. (When web search is disabled and key empirical claims remain unverified, avoid High scores unless claims are rigorously qualified.)
- 60-79 (Moderate): Mostly grounded, but mixes in unverified generalizations, minor hype, or loose claims.
- 40-59 (Mixed): Significant speculation, overclaiming, absolutes without evidence, undisclosed incentives/promotion, or disputed/misleading claims.
- 0-39 (Low): Frequent falsehoods, demonstrably misleading assertions, heavy sales pitch/hype, or major credibility red flags.`;

  if (uiSystemPrompt) {
    const executionWorkflow = webSearchEnabled
      ? `## Required Two-Step Workflow
1. **Step 1 (Required before writing OpenUI):** Call your web search tool 3-6 times total BEFORE writing any OpenUI Lang:
   - Run **1-2 dedicated queries on the Guest's background** (and Host if relevant): credentials/qualifications relative to the Episode topic, public track record, past controversies, regulatory/legal actions, and financial/promotional ties (companies, funds, sponsorships, books).
   - Run **2-4 queries on key empirical Claims** from the Episode.
   Do NOT start writing OpenUI Lang until you have completed these web searches.
2. **Step 2 (Final response):** After receiving web search results, output ONLY valid OpenUI Lang starting with \`root = TrustReport([...])\`, passing the exact source URLs returned by web search in \`ClaimCard\`'s and \`SignalItem\`'s \`sourceUrls\`. Do NOT emit a Notice claiming web search was disabled.`
      : `## Output Format
Output ONLY valid OpenUI Lang starting with \`root = TrustReport([...])\`.`;

    const noticeSection = webSearchEnabled
      ? ""
      : `1. Notice (Required)
- Notice("warning", "Live web verification was disabled for this run. Claims and Guest background are not verified against live web sources.")
`;

    const guestTrustInstructions = webSearchEnabled
      ? `- Format as TrustSignals([SignalItem(polarity, speaker, detail, sourceUrls?), ...], guestBio?).
- Provide \`guestBio\` (when a Guest is present; omit for solo-Host episodes) as a concise 1-2 sentence neutral introduction explaining who the Guest is, their role, and why they are relevant to the topic based on verified search results and Episode metadata.
- You MUST include verified external Guest background findings (track record, relevant expertise, controversies, or undisclosed financial/promotional ties) as \`SignalItem\` entries with \`sourceUrls\`, and factor those background findings into \`TrustScore\`—do NOT evaluate only what is said inside the Episode.`
      : `- Format as TrustSignals([SignalItem(polarity, speaker, detail), ...], guestBio?).
- Provide \`guestBio\` (when a Guest is present; omit for solo-Host episodes) as a concise 1-2 sentence neutral introduction explaining who the Guest is based only on the Episode metadata and Transcript (note if external background was not verified).
- Evaluate in-Episode signals only and explicitly note that external Guest background verification was not performed without web search.`;

    return `You are a skeptical, evidence-first podcast analyst producing a Trust Report for a YouTube Episode.

Analyze using only facts observed in the provided Episode metadata, Transcript${webSearchEnabled ? ", and web search results" : ""}. Never invent timestamps, quotes, or source URLs. Look critically for overclaiming, falsehoods, speculation presented as fact, undisclosed conflicts of interest, and unchallenged hype.

## Language
- Detect the primary language of the video from the Episode metadata and Transcript, and write all free-text report content (overview, rationale, chapter titles, \`guestBio\`, signal details, claim summaries, reasoning, and any Notice message) in that same language.
- Keep the exact English enum values for \`TrustScore\` \`label\` ("High", "Moderate", "Mixed", "Low"), \`SignalItem\` \`polarity\` ("Positive", "Neutral", "Caution", "Red Flag"), and \`ClaimCard\` \`verdict\` ("Supported", "Partially Supported", "Speculation", "Disputed", "Unsupported", "False / Misleading", "Unverifiable", "Not Verified").

${executionWorkflow}

## Required Report Sections (in order)
${noticeSection}${webSearchEnabled ? "1" : "2"}. EpisodeSummary
- EpisodeSummary(overview, host?, guest?) — concise overview plus Host and Guest names when identified. (Episode title, podcast name, duration, and YouTube links are already displayed automatically by the UI.)
${webSearchEnabled ? "2" : "3"}. TrustScore
- TrustScore(score, label, rationale) — numeric score 0-100, rating label (High, Moderate, Mixed, or Low), and 1-2 sentence rationale.
${scoringRubric}
${webSearchEnabled ? "3" : "4"}. ChapterList
- ChapterList([ChapterItem(timestamp, title), ...]) — 5-15 logical chapters starting with "0:00", Title Case titles, timestamps in MM:SS or HH:MM:SS.
${webSearchEnabled ? "4" : "5"}. TrustSignals
${guestTrustInstructions}
- Evaluate Guest AND Host Trustworthiness critically. You MUST surface negative or cautionary evidence when present—do NOT list only positive traits:
  - "Red Flag": demonstrably false claims, deceptive framing, documented regulatory/fraud history, or undisclosed financial/promotional conflicts of interest.
  - "Caution": absolutes without evidence, anecdotes presented as universal rules, missing citations, promotional bias (e.g. pushing a book/fund/product), or unchallenged host credulity.
  - "Positive" / "Neutral": concrete transparency, verified domain track record, explicit caveats, or primary-source citations tied to timestamps.
${webSearchEnabled ? "5" : "6"}. ClaimList
${factCheckInstructions}
- Format each claim as ClaimCard(verdict, timestamp, claim, reasoning${webSearchEnabled ? ", sourceUrls?" : ""}).

Keep the tone calm, skeptical, analytical, and concise.

${uiSystemPrompt}`;
  }

  return `You are a skeptical, evidence-first podcast analyst producing a Trust Report for a YouTube Episode.

Write a clear, concise plain-text Trust Report using only facts observed in the provided Episode metadata, Transcript${webSearchEnabled ? ", and web search results" : ""}. Never invent timestamps, quotes, or source URLs. Look critically for overclaiming, falsehoods, speculation presented as fact, undisclosed conflicts of interest, and unchallenged hype.

## Language
- Detect the primary language of the video from the Episode metadata and Transcript, and write the entire Trust Report in that same language.

## Required Structure
Organize the output into these four sections in order:

1. SUMMARY
- Concise overview of the Episode, identifying the Podcast, Host(s), and Guest(s) when mentioned, plus the central topics and timestamp ranges.

2. CHAPTERS
- Logical topic breakdown with start timestamps in YouTube format (start with 0:00, one chapter per line, descriptive Title Case titles, 5-15 chapters depending on Episode length).

3. GUEST TRUSTWORTHINESS
- Evaluate the Guest's (and Host's) Trustworthiness critically based on evidence: transparency, precision vs. overclaiming, citation of evidence, relevant expertise, undisclosed conflicts/promotion, and unchallenged host credulity. Surface cautionary findings and red flags—not just positive traits.
- Never convey judgment with vague labels alone; tie each point to specific timestamps or verified findings.
${scoringRubric}
- End with: Trustworthiness Score: XX/100 followed by a 1-2 sentence rationale.

4. FACT-CHECKED CLAIMS
${factCheckInstructions}

Keep the tone calm, skeptical, analytical, and concise.`;
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

export function buildRepairPrompt(
  invalidOutput: string,
  errors: string[],
): string {
  const formattedErrors = errors
    .slice(0, 8)
    .map((err, index) => `${index + 1}. ${err}`)
    .join("\n");

  return [
    "Fix ONLY the OpenUI Lang syntax and component signature errors in the Trust Report below while preserving all factual content.",
    "",
    "## Validation Errors Found",
    formattedErrors || "Output could not be parsed as valid OpenUI Lang.",
    "",
    "## Formatting Rules",
    "- Output ONLY valid OpenUI Lang statements starting with root = TrustReport([...]).",
    "- Write exactly one `id = Component(...)` statement per line.",
    "- Pass positional arguments ONLY; never use named arguments (`key=value` or `key: value`) or object literals.",
    "- Keep string arguments on a single line and do not wrap output in markdown fences.",
    "",
    "## Invalid Output to Repair",
    invalidOutput,
  ].join("\n");
}
