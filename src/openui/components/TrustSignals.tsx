import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Badge, Card, CardContent, CardHeader, Flex } from "@/components/ui";
import sharedStyles from "./ReportPrimitives.module.css";
import { SignalItemOUID } from "./SignalItem";
import styles from "./TrustSignals.module.css";

export const TrustSignalsOUID = defineComponent({
  name: "TrustSignals",
  description:
    "Displays evidence-backed Host / Podcast and Guest Trustworthiness signals grouped into separate subsections, each with an optional short bio.",
  props: z.object({
    hostSignals: z
      .array(SignalItemOUID.ref)
      .describe("List of Host / Podcast SignalItem components"),
    hostBio: z
      .string()
      .optional()
      .describe(
        "Optional 1-2 sentence neutral context explaining who the Host / Podcast is and their editorial background",
      ),
    guestSignals: z
      .array(SignalItemOUID.ref)
      .optional()
      .describe(
        "Optional list of Guest SignalItem components (omit on solo-Host episodes)",
      ),
    guestBio: z
      .string()
      .optional()
      .describe(
        "Optional 1-2 sentence neutral introduction explaining who the Guest is, their role, and relevance to the topic",
      ),
  }),
  component: ({ props, renderNode }) => {
    const hostSignalNodes = Array.isArray(props.hostSignals)
      ? props.hostSignals.filter(Boolean)
      : [];
    const guestSignalNodes = Array.isArray(props.guestSignals)
      ? props.guestSignals.filter(Boolean)
      : [];

    const hostBio =
      typeof props.hostBio === "string" ? props.hostBio.trim() : "";
    const guestBio =
      typeof props.guestBio === "string" ? props.guestBio.trim() : "";

    const totalCount = hostSignalNodes.length + guestSignalNodes.length;
    const showHostSection = Boolean(hostBio) || hostSignalNodes.length > 0;
    const showGuestSection = Boolean(guestBio) || guestSignalNodes.length > 0;

    return (
      <Card>
        <CardHeader>
          <h2 className={sharedStyles.sectionHeading}>
            Trustworthiness Signals
          </h2>
          <Badge mono>{totalCount}</Badge>
        </CardHeader>
        <CardContent>
          <div className={styles.sideSections}>
            {showHostSection ? (
              <section
                className={styles.sideSection}
                aria-label="Host and Podcast signals"
              >
                <div className={styles.sideHeader}>
                  <h3 className={styles.sideHeading}>Host / Podcast</h3>
                  <Badge mono>{hostSignalNodes.length}</Badge>
                </div>

                {hostBio ? (
                  <div className={styles.bioBox}>
                    <span className={styles.bioLabel}>
                      About the Host / Podcast
                    </span>
                    <p className={sharedStyles.bodyText}>{hostBio}</p>
                  </div>
                ) : null}

                {hostSignalNodes.length > 0 ? (
                  <Flex direction="column" gap={3}>
                    {renderNode(props.hostSignals)}
                  </Flex>
                ) : null}
              </section>
            ) : null}

            {showGuestSection ? (
              <section
                className={styles.sideSection}
                aria-label="Guest signals"
              >
                <div className={styles.sideHeader}>
                  <h3 className={styles.sideHeading}>Guest</h3>
                  <Badge mono>{guestSignalNodes.length}</Badge>
                </div>

                {guestBio ? (
                  <div className={styles.bioBox}>
                    <span className={styles.bioLabel}>About the Guest</span>
                    <p className={sharedStyles.bodyText}>{guestBio}</p>
                  </div>
                ) : null}

                {guestSignalNodes.length > 0 ? (
                  <Flex direction="column" gap={3}>
                    {renderNode(props.guestSignals)}
                  </Flex>
                ) : null}
              </section>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  },
});
