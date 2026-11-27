import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Badge, Card, CardContent, CardHeader, Stat } from "@/components/ui";
import { useEpisodeMetadata } from "./EpisodeMetadataContext";
import styles from "./EpisodeSummary.module.css";
import sharedStyles from "./ReportPrimitives.module.css";

const episodeSummaryPropsSchema = z.object({
  overview: z.string().describe("Concise overview of the Episode"),
  host: z.string().optional().describe("Optional Host name(s)"),
  guest: z.string().optional().describe("Optional Guest name(s)"),
});

type EpisodeSummaryProps = z.infer<typeof episodeSummaryPropsSchema>;

function EpisodeSummaryView(props: EpisodeSummaryProps) {
  const metadata = useEpisodeMetadata();

  const metadataStats = [
    metadata?.author
      ? { label: "Podcast", value: metadata.author, mono: false }
      : null,
    props.host?.trim()
      ? { label: "Host", value: props.host.trim(), mono: false }
      : null,
    props.guest?.trim()
      ? { label: "Guest", value: props.guest.trim(), mono: false }
      : null,
    metadata?.durationFormatted
      ? { label: "Duration", value: metadata.durationFormatted, mono: true }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <Card>
      <CardHeader>
        <h2 className={sharedStyles.sectionHeading}>
          {metadata?.title || "Episode Summary"}
        </h2>
        <Badge tone="info">Summary</Badge>
      </CardHeader>
      <CardContent>
        {metadataStats.length > 0 ? (
          <div className={styles.metaGrid}>
            {metadataStats.map((stat) => (
              <Stat
                key={stat.label}
                label={stat.label}
                value={stat.value}
                mono={stat.mono}
              />
            ))}
          </div>
        ) : null}

        <p className={sharedStyles.bodyText}>{props.overview ?? ""}</p>
      </CardContent>
    </Card>
  );
}

export const EpisodeSummaryOUID = defineComponent({
  name: "EpisodeSummary",
  description:
    "Summarizes the Episode with overview and optional Host/Guest names.",
  props: episodeSummaryPropsSchema,
  component: ({ props }) => <EpisodeSummaryView {...props} />,
});
