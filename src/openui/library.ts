import { createLibrary, createParser } from "@openuidev/react-lang";
import { ChapterItemOUID } from "./components/ChapterItem";
import { ChapterListOUID } from "./components/ChapterList";
import { ClaimCardOUID } from "./components/ClaimCard";
import { ClaimListOUID } from "./components/ClaimList";
import { EpisodeSummaryOUID } from "./components/EpisodeSummary";
import { NoticeOUID } from "./components/Notice";
import { SignalItemOUID } from "./components/SignalItem";
import { TrustReportOUID } from "./components/TrustReport";
import { TrustScoreOUID } from "./components/TrustScore";
import { TrustSignalsOUID } from "./components/TrustSignals";
import { normalizeOpenUiResponse } from "./utils";

export const trustReportLibrary = createLibrary({
  root: "TrustReport",
  components: [
    TrustReportOUID,
    NoticeOUID,
    EpisodeSummaryOUID,
    TrustScoreOUID,
    ChapterListOUID,
    ChapterItemOUID,
    ClaimListOUID,
    ClaimCardOUID,
    TrustSignalsOUID,
    SignalItemOUID,
  ],
});

export const TRUST_REPORT_UI_PROMPT = trustReportLibrary.prompt({
  additionalRules: [
    "In your final response (after any tool calls complete), output ONLY valid OpenUI Lang statements starting with root = TrustReport([...]).",
    "Write exactly one `id = Component(...)` statement per line.",
    "Pass positional arguments ONLY. NEVER use named arguments (no `key=value` or `key: value`), object literals, or extra arguments.",
    "Keep every string argument on a single line and avoid unescaped double quotes inside string literals.",
    "Do NOT wrap your output in markdown code fences (no ```), and do NOT include any prose before or after the OpenUI Lang statements.",
    "Order top-level sections inside TrustReport as: EpisodeSummary, TrustScore, ChapterList, TrustSignals, ClaimList (and an optional leading Notice only when explicitly instructed).",
    "NEVER place ChapterItem directly inside TrustReport; always wrap ChapterItem items inside ChapterList([...]).",
    "NEVER place ClaimCard directly inside TrustReport; always wrap ClaimCard items inside ClaimList([...]).",
    "NEVER place SignalItem directly inside TrustReport; always wrap SignalItem items inside TrustSignals([...], guestBio?).",
    "Pass ClaimCard and SignalItem sourceUrls as an array of plain HTTPS/HTTP URL strings returned by web search, or omit it when web search is disabled.",
    "Write all free-text content (overview, rationale, chapter titles, guestBio, signal details, claim summaries, reasoning, and Notice messages) in the primary language of the video, while keeping exact English enum values for TrustScore label, SignalItem polarity, and ClaimCard verdict.",
    "Never invent timestamps, quotes, or source URLs.",
  ],
  examples: [
    `root = TrustReport([summary, score, chapters, signals, claims])
summary = EpisodeSummary("Discussion of macroeconomic cycles, inflation hedging, and portfolio diversification.", "Host Name", "Guest Name")
score = TrustScore(58, "Mixed", "Core inflation framing aligns with historical data, but several absolute asset claims are overstated and paired with undisclosed product promotion.")
chapters = ChapterList([ch1, ch2])
ch1 = ChapterItem("0:00", "Introduction and Background")
ch2 = ChapterItem("12:30", "Inflation and Asset Claims")
signals = TrustSignals([s1, s2, s3], "Guest Name is an asset manager and author known for commodity-focused commentary and macro newsletters.")
s1 = SignalItem("Positive", "Guest Name", "Explicitly walked through downside scenario assumptions at 04:10.")
s2 = SignalItem("Caution", "Host Name", "Accepted absolute asset-class claims without asking for counterexamples or data at 14:20.")
s3 = SignalItem("Red Flag", "Guest Name", "Manages a commodity fund mentioned at 16:05 without disclosing management fees or financial interest.", ["https://example.org/guest-fund-filing"])
claims = ClaimList([c1, c2, c3])
c1 = ClaimCard("Supported", "04:10", "US CPI averaged roughly 3% annually over the past century.", "Consistent with long-run BLS inflation series.", ["https://example.org/cpi-data"])
c2 = ClaimCard("Speculation", "09:45", "A major currency reset is guaranteed within five years.", "Presented as certainty without quantitative probability or falsifiable criteria.")
c3 = ClaimCard("False / Misleading", "14:20", "Gold is the only asset with zero counterparty risk.", "Overstated absolute; physical real estate, commodities, and direct equity also carry no issuer default risk.")`,
  ],
});

const trustReportParser = createParser(
  trustReportLibrary.toJSONSchema(),
  trustReportLibrary.root,
);

export function validateTrustReportOutput(raw: string): {
  valid: boolean;
  hasRoot: boolean;
  errors: string[];
  errorMessage?: string;
} {
  const normalized = normalizeOpenUiResponse(raw).trim();
  if (!normalized) {
    const message = "Model returned an empty Trust Report response.";
    return {
      valid: false,
      hasRoot: false,
      errors: [message],
      errorMessage: message,
    };
  }

  try {
    const result = trustReportParser.parse(normalized);
    const hasRoot = Boolean(result.root);
    const errors = result.meta.errors.map((err) => err.message);

    if (!hasRoot) {
      const message =
        errors[0] ??
        "Response could not be parsed as a structured Trust Report.";
      return {
        valid: false,
        hasRoot: false,
        errors: errors.length > 0 ? errors : [message],
        errorMessage: message,
      };
    }

    if (errors.length > 0) {
      return {
        valid: false,
        hasRoot: true,
        errors,
        errorMessage: errors[0],
      };
    }

    return { valid: true, hasRoot: true, errors: [] };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Response could not be parsed as a structured Trust Report.";
    return {
      valid: false,
      hasRoot: false,
      errors: [message],
      errorMessage: message,
    };
  }
}
