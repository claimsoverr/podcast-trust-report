import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import {
  Badge,
  type BadgeTone,
  Card,
  CardContent,
  CardHeader,
  Meter,
  type MeterTone,
} from "@/components/ui";
import { parseScoreValue } from "../utils";
import sharedStyles from "./ReportPrimitives.module.css";
import styles from "./TrustScore.module.css";

function getScoreTone(score: number): {
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

export const TrustScoreOUID = defineComponent({
  name: "TrustScore",
  description:
    "Displays the overall Trustworthiness Score (0-100), rating label, and brief rationale.",
  props: z.object({
    score: z
      .union([z.number(), z.string()])
      .describe("Trustworthiness Score from 0 to 100"),
    label: z
      .string()
      .describe('Rating label such as "High", "Moderate", "Mixed", or "Low"'),
    rationale: z
      .string()
      .describe("1-2 sentence rationale explaining the Trustworthiness Score"),
  }),
  component: ({ props }) => {
    const clampedScore = parseScoreValue(props.score);
    const { badgeTone, meterTone } = getScoreTone(clampedScore);

    return (
      <Card>
        <CardHeader>
          <h2 className={sharedStyles.sectionHeading}>Trustworthiness Score</h2>
          <Badge tone={badgeTone}>{props.label || "Evaluating"}</Badge>
        </CardHeader>
        <CardContent>
          <div className={styles.scoreRow}>
            <div className={styles.scoreValue}>
              {clampedScore}
              <span className={styles.scoreScale}>/100</span>
            </div>
          </div>
          <Meter
            label="Overall Trustworthiness"
            value={clampedScore}
            valueText={`${clampedScore}/100`}
            tone={meterTone}
            showValue={false}
          />
          <p className={`${sharedStyles.bodyText} ${styles.rationale}`}>
            {props.rationale ?? ""}
          </p>
        </CardContent>
      </Card>
    );
  },
});
