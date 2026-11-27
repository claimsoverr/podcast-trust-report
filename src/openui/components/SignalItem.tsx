import { defineComponent } from "@openuidev/react-lang";
import { ExternalLink } from "lucide-react";
import { z } from "zod";
import { Badge, type BadgeTone } from "@/components/ui";
import { formatUrlHostname, sanitizeHttpUrl } from "../utils";
import sharedStyles from "./ReportPrimitives.module.css";
import styles from "./SignalItem.module.css";

const SIGNAL_POLARITIES = [
  "Positive",
  "Neutral",
  "Caution",
  "Red Flag",
] as const;
type SignalPolarity = (typeof SIGNAL_POLARITIES)[number];

const POLARITY_TONES: Record<SignalPolarity, BadgeTone> = {
  Positive: "success",
  Neutral: "neutral",
  Caution: "warning",
  "Red Flag": "danger",
};

function normalizePolarity(raw: string | undefined): SignalPolarity {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (
    normalized.includes("red flag") ||
    normalized.includes("red_flag") ||
    normalized.includes("severe") ||
    normalized.includes("critical") ||
    normalized.includes("lie") ||
    normalized.includes("decept") ||
    normalized.includes("false") ||
    normalized.includes("danger")
  ) {
    return "Red Flag";
  }
  if (
    normalized.includes("caution") ||
    normalized.includes("negative") ||
    normalized.includes("warning") ||
    normalized.includes("concern") ||
    normalized.includes("bias") ||
    normalized.includes("hype")
  ) {
    return "Caution";
  }
  if (
    normalized.includes("positive") ||
    normalized.includes("good") ||
    normalized.includes("strong")
  ) {
    return "Positive";
  }
  return "Neutral";
}

export const SignalItemOUID = defineComponent({
  name: "SignalItem",
  description:
    "An evidence-backed Guest or Host Trustworthiness signal. Wrap inside TrustSignals.",
  props: z.object({
    polarity: z
      .string()
      .describe(
        'Signal polarity: "Positive", "Neutral", "Caution", or "Red Flag"',
      ),
    speaker: z.string().describe("Speaker name or role, e.g. Guest or Host"),
    detail: z
      .string()
      .describe(
        "Evidence-backed explanation tied to timestamps or verified background findings",
      ),
    sourceUrls: z
      .array(z.string())
      .optional()
      .describe("Optional list of verified external source URLs"),
  }),
  component: ({ props }) => {
    const polarity = normalizePolarity(props.polarity);
    const validSources = Array.isArray(props.sourceUrls)
      ? props.sourceUrls
          .map((rawUrl) => sanitizeHttpUrl(rawUrl))
          .filter((url): url is string => url !== null)
      : [];

    return (
      <div className={styles.signalItem}>
        <div className={styles.header}>
          <div className={styles.meta}>
            <Badge tone={POLARITY_TONES[polarity]}>{polarity}</Badge>
            <span className={styles.subject}>{props.speaker ?? ""}</span>
          </div>
        </div>

        <p className={sharedStyles.mutedText}>{props.detail ?? ""}</p>

        {validSources.length > 0 ? (
          <ul className={styles.sourcesList} aria-label="Signal sources">
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
        ) : null}
      </div>
    );
  },
});
