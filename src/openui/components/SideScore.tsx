import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import {
  Badge,
  type BadgeTone,
  Meter,
  type MeterTone,
} from "@/components/ui";
import { parseScoreValue } from "../utils";
import sharedStyles from "./ReportPrimitives.module.css";
import styles from "./SideScore.module.css";

export function getScoreTone(score: number): {
  badgeTone: BadgeTone;
  meterTone: MeterTone;
} {
  if (score >= 75) {
    return { badgeTone: "success", meterTone: "success" };
  }
  if (score >= 45) {
    return { badgeTone: "warning", meterTone: "warning" };
  }
  return { badgeTone: "danger", meterTone: "danger" };
}

function formatSideRole(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim();
  const normalized = trimmed.toLowerCase();

  if (normalized.includes("host") || normalized.includes("podcast")) {
    return "Host / Podcast";
  }
  if (normalized.includes("guest")) {
    return "Guest";
  }
  return trimmed || "Side";
}

export const SideScoreOUID = defineComponent({
  name: "SideScore",
  description:
    'Displays an individual Host or Guest Trustworthiness Score (0-100), rating label, and concise rationale. Wrap inside TrustScore.',
  props: z.object({
    role: z.string().describe('Participant side: "Host" or "Guest"'),
    score: z
      .union([z.number(), z.string()])
      .describe("Side Trustworthiness Score from 0 to 100"),
    label: z
      .string()
      .describe('Rating label: "High", "Moderate", "Mixed", or "Low"'),
    rationale: z
      .string()
      .describe("Concise 1-sentence rationale explaining this side's score"),
  }),
  component: ({ props }) => {
    const clampedScore = parseScoreValue(props.score);
    const { badgeTone, meterTone } = getScoreTone(clampedScore);
    const displayRole = formatSideRole(props.role);

    return (
      <div className={styles.sideCard}>
        <div className={styles.header}>
          <span className={styles.roleLabel}>{displayRole}</span>
          <Badge tone={badgeTone}>{props.label || "Evaluating"}</Badge>
        </div>

        <div className={styles.scoreValue}>
          {clampedScore}
          <span className={styles.scoreScale}>/100</span>
        </div>

        <Meter
          label={`${displayRole} Trustworthiness`}
          value={clampedScore}
          valueText={`${clampedScore}/100`}
          tone={meterTone}
          showValue={false}
        />

        <p className={sharedStyles.mutedText}>{props.rationale ?? ""}</p>
      </div>
    );
  },
});
