import { defineComponent } from "@openuidev/react-lang";
import { ExternalLink, Play } from "lucide-react";
import { z } from "zod";
import { TimelineItem } from "@/components/ui";
import { buildYouTubeTimestampUrl, parseTimestampToSeconds } from "../utils";
import { useEpisodeMetadata, useSeekTimestamp } from "./EpisodeMetadataContext";
import sharedStyles from "./ReportPrimitives.module.css";

const chapterItemPropsSchema = z.object({
  timestamp: z
    .string()
    .describe("Chapter start timestamp in YouTube format, e.g. 0:00 or 12:34"),
  title: z.string().describe("Descriptive Title Case Chapter title"),
});

type ChapterItemProps = z.infer<typeof chapterItemPropsSchema>;

function ChapterItemView(props: ChapterItemProps) {
  const metadata = useEpisodeMetadata();
  const onSeekTimestamp = useSeekTimestamp();
  const seconds = parseTimestampToSeconds(props.timestamp);
  const safeUrl = buildYouTubeTimestampUrl(metadata?.videoId, props.timestamp);

  const timeNode =
    onSeekTimestamp && seconds !== null ? (
      <button
        type="button"
        className={sharedStyles.timestampButton}
        onClick={() => onSeekTimestamp(seconds)}
        aria-label={`Jump video to ${props.timestamp}`}
      >
        <Play aria-hidden="true" size={12} />
        {props.timestamp ?? ""}
      </button>
    ) : safeUrl ? (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={sharedStyles.timestampLink}
      >
        {props.timestamp ?? ""}
        <ExternalLink aria-hidden="true" size={12} />
      </a>
    ) : (
      <span>{props.timestamp ?? ""}</span>
    );

  return <TimelineItem time={timeNode} title={props.title ?? ""} />;
}

export const ChapterItemOUID = defineComponent({
  name: "ChapterItem",
  description:
    "A single timestamped Chapter in the Episode. Wrap inside ChapterList.",
  props: chapterItemPropsSchema,
  component: ({ props }) => <ChapterItemView {...props} />,
});
