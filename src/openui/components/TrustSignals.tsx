import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Badge, Card, CardContent, CardHeader, Flex } from "@/components/ui";
import sharedStyles from "./ReportPrimitives.module.css";
import { SignalItemOUID } from "./SignalItem";
import styles from "./TrustSignals.module.css";

export const TrustSignalsOUID = defineComponent({
  name: "TrustSignals",
  description:
    "Displays a brief Guest background summary (optional) and evidence-backed Guest and Host Trustworthiness signals.",
  props: z.object({
    signals: z
      .array(SignalItemOUID.ref)
      .describe("List of SignalItem components"),
    guestBio: z
      .string()
      .optional()
      .describe(
        "Optional 1-2 sentence introduction explaining who the Guest is, their role, and relevance to the topic",
      ),
  }),
  component: ({ props, renderNode }) => {
    const count = Array.isArray(props.signals)
      ? props.signals.filter(Boolean).length
      : 0;
    const guestBio =
      typeof props.guestBio === "string" ? props.guestBio.trim() : "";

    return (
      <Card>
        <CardHeader>
          <h2 className={sharedStyles.sectionHeading}>Guest Trustworthiness</h2>
          <Badge mono>{count}</Badge>
        </CardHeader>
        <CardContent>
          {guestBio ? (
            <div className={styles.guestBio}>
              <span className={styles.bioLabel}>About the Guest</span>
              <p className={sharedStyles.bodyText}>{guestBio}</p>
            </div>
          ) : null}

          <Flex direction="column" gap={3}>
            {renderNode(props.signals)}
          </Flex>
        </CardContent>
      </Card>
    );
  },
});
