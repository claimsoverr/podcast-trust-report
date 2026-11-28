import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Badge, Card, CardContent, CardHeader, Meter } from "@/components/ui";
import { parseScoreValue } from "../utils";
import sharedStyles from "./ReportPrimitives.module.css";
import { getScoreTone, SideScoreOUID } from "./SideScore";
import styles from "./TrustScore.module.css";

export const TrustScoreOUID = defineComponent({
  name: "TrustScore",
  description:
    "Displays the overall Episode Trustworthiness Score (0-100), rating label, rationale, and optional separate Host and Guest SideScore items.",
  props: z.object({
    score: z
      .union([z.number(), z.string()])
      .describe("Overall Episode Trustworthiness Score from 0 to 100"),
    label: z
      .string()
      .describe('Rating label such as "High", "Moderate", "Mixed", or "Low"'),
    rationale: z
      .string()
      .describe(
        "1-2 sentence rationale explaining the overall Episode Trustworthiness Score and any Host/Guest divergence",
      ),
    sideScores: z
      .array(SideScoreOUID.ref)
      .optional()
      .describe(
        "Optional list of SideScore components assessing Host and Guest separately",
      ),
  }),
  component: ({ props, renderNode }) => {
    const clampedScore = parseScoreValue(props.score);
    const { badgeTone, meterTone } = getScoreTone(clampedScore);
    const sideScoreNodes = Array.isArray(props.sideScores)
      ? props.sideScores.filter(Boolean)
      : [];

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
            label="Overall Episode Trustworthiness"
            value={clampedScore}
            valueText={`${clampedScore}/100`}
            tone={meterTone}
            showValue={false}
          />
          <p className={`${sharedStyles.bodyText} ${styles.rationale}`}>
            {props.rationale ?? ""}
          </p>

          {sideScoreNodes.length > 0 ? (
            <div className={styles.sideGrid}>{renderNode(props.sideScores)}</div>
          ) : null}
        </CardContent>
      </Card>
    );
  },
});
