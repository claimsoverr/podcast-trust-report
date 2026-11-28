import { defineComponent } from "@openuidev/react-lang";
import { ExternalLink, Play } from "lucide-react";
import { z } from "zod";
import { Badge, type BadgeTone, Disclosure } from "@/components/ui";
import {
  buildYouTubeTimestampUrl,
  formatUrlHostname,
  parseTimestampToSeconds,
  sanitizeHttpUrl,
} from "../utils";
import styles from "./ClaimCard.module.css";
import { useClaimFilter } from "./ClaimFilterContext";
import { useEpisodeMetadata, useSeekTimestamp } from "./EpisodeMetadataContext";
import sharedStyles from "./ReportPrimitives.module.css";

export const CLAIM_VERDICTS = [
  "Supported",
  "Partially Supported",
  "Speculation",
  "Disputed",
  "Unsupported",
  "False / Misleading",
  "Unverifiable",
  "Not Verified",
] as const;

export type ClaimVerdict = (typeof CLAIM_VERDICTS)[number];

export const CLAIM_SPEAKER_ROLES = ["Host", "Guest"] as const;
export type ClaimSpeakerRole = (typeof CLAIM_SPEAKER_ROLES)[number];

export function normalizeSpeakerRole(
  raw: string | undefined,
): ClaimSpeakerRole | null {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (
    normalized.includes("host") ||
    normalized.includes("podcast") ||
    normalized.includes("interviewer")
  ) {
    return "Host";
  }
  if (
    normalized.includes("guest") ||
    normalized.includes("panelist") ||
    normalized.includes("interviewee")
  ) {
    return "Guest";
  }
  return null;
}

export function normalizeVerdict(raw: string | undefined): ClaimVerdict {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (!normalized) {
    return "Unverifiable";
  }
  if (
    normalized.includes("false") ||
    normalized.includes("lie") ||
    normalized.includes("misleading") ||
    normalized.includes("overstat") ||
    normalized.includes("inaccurate") ||
    normalized.includes("exaggerat")
  ) {
    return "False / Misleading";
  }
  if (
    normalized.includes("speculat") ||
    normalized.includes("opinion") ||
    normalized.includes("anecdot") ||
    normalized.includes("unsubstantiated")
  ) {
    return "Speculation";
  }
  if (normalized.includes("partially")) {
    return "Partially Supported";
  }
  if (normalized.includes("unsupported")) {
    return "Unsupported";
  }
  if (normalized.includes("not verified") || normalized.includes("unverified")) {
    return "Not Verified";
  }
  if (normalized.includes("disputed") || normalized.includes("contested")) {
    return "Disputed";
  }
  if (normalized.includes("supported") || normalized === "true") {
    return "Supported";
  }
  if (normalized.includes("unverifiable")) {
    return "Unverifiable";
  }
  return "Unverifiable";
}

function getVerdictBadgeTone(verdict: ClaimVerdict): BadgeTone {
  switch (verdict) {
    case "Supported": {
      return "success";
    }
    case "Partially Supported":
    case "Speculation": {
      return "warning";
    }
    case "Unsupported":
    case "Disputed":
    case "False / Misleading": {
      return "danger";
    }
    case "Unverifiable":
    case "Not Verified": {
      return "neutral";
    }
  }
}

const claimCardPropsSchema = z.object({
  verdict: z
    .string()
    .describe(
      'Verification verdict: "Supported", "Partially Supported", "Speculation", "Disputed", "Unsupported", "False / Misleading", "Unverifiable", or "Not Verified"',
    ),
  timestamp: z.string().describe("Episode timestamp such as 04:15"),
  speaker: z
    .string()
    .describe('Speaker side making the Claim: "Host" or "Guest"'),
  claim: z.string().describe("Concise summary of the factual Claim"),
  reasoning: z
    .string()
    .describe("Concise evidence-based reasoning for the Verdict"),
  sourceUrls: z
    .array(z.string())
    .optional()
    .describe("Optional list of verified external source URLs"),
});

type ClaimCardProps = z.infer<typeof claimCardPropsSchema>;

function ClaimCardView(props: ClaimCardProps) {
  const { activeVerdict, activeSpeaker } = useClaimFilter();
  const metadata = useEpisodeMetadata();
  const onSeekTimestamp = useSeekTimestamp();
  const verdict = normalizeVerdict(props.verdict);
  const speakerRole = normalizeSpeakerRole(props.speaker);
  const rawSpeaker = typeof props.speaker === "string" ? props.speaker.trim() : "";

  if (activeVerdict !== null && activeVerdict !== verdict) {
    return null;
  }
  if (activeSpeaker !== null && activeSpeaker !== speakerRole) {
    return null;
  }

  const badgeTone = getVerdictBadgeTone(verdict);
  const speakerBadgeLabel = speakerRole ?? rawSpeaker;
  const seconds = parseTimestampToSeconds(props.timestamp);
  const safeTimestampUrl = buildYouTubeTimestampUrl(
    metadata?.videoId,
    props.timestamp,
  );

  const validSources = Array.isArray(props.sourceUrls)
    ? props.sourceUrls
        .map((rawUrl) => sanitizeHttpUrl(rawUrl))
        .filter((url): url is string => url !== null)
    : [];

  return (
    <article className={styles.claimCard}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <Badge tone={badgeTone}>{verdict}</Badge>
          {speakerBadgeLabel ? (
            <Badge tone="neutral">{speakerBadgeLabel}</Badge>
          ) : null}
          {props.timestamp ? (
            onSeekTimestamp && seconds !== null ? (
              <button
                type="button"
                className={sharedStyles.timestampButton}
                onClick={() => onSeekTimestamp(seconds)}
                aria-label={`Jump video to ${props.timestamp}`}
              >
                <Play aria-hidden="true" size={12} />
                {props.timestamp}
              </button>
            ) : safeTimestampUrl ? (
              <a
                href={safeTimestampUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={sharedStyles.timestampLink}
              >
                {props.timestamp}
                <ExternalLink aria-hidden="true" size={12} />
              </a>
            ) : (
              <span className={styles.timestampPlain}>{props.timestamp}</span>
            )
          ) : null}
        </div>
      </div>

      <p className={sharedStyles.bodyText}>{props.claim ?? ""}</p>

      <Disclosure
        summary={
          validSources.length > 0
            ? `Reasoning & sources (${validSources.length})`
            : "Reasoning"
        }
      >
        <p className={sharedStyles.mutedText}>{props.reasoning ?? ""}</p>

        {validSources.length > 0 ? (
          <div className={styles.sourcesSection}>
            <span className={styles.sourcesLabel}>Sources</span>
            <ul className={styles.sourcesList}>
              {validSources.map((url, index) => (
                <li key={`${url}-${index}`}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={url}
                    className={sharedStyles.externalLink}
                  >
                    {formatUrlHostname(url)}
                    <ExternalLink aria-hidden="true" size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Disclosure>
    </article>
  );
}

export const ClaimCardOUID = defineComponent({
  name: "ClaimCard",
  description:
    "A single fact-checked Claim with Verdict, timestamp, speaker role (Host or Guest), claim summary, reasoning, and optional sources. Wrap inside ClaimList.",
  props: claimCardPropsSchema,
  component: ({ props }) => <ClaimCardView {...props} />,
});
