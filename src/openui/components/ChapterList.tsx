import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  Timeline,
} from "@/components/ui";
import { ChapterItemOUID } from "./ChapterItem";
import sharedStyles from "./ReportPrimitives.module.css";

export const ChapterListOUID = defineComponent({
  name: "ChapterList",
  description: "Displays the Episode's timestamped Chapters.",
  props: z.object({
    chapters: z
      .array(ChapterItemOUID.ref)
      .describe("Ordered list of ChapterItem components"),
  }),
  component: ({ props, renderNode }) => {
    const count = Array.isArray(props.chapters)
      ? props.chapters.filter(Boolean).length
      : 0;

    return (
      <Card>
        <CardHeader>
          <h2 className={sharedStyles.sectionHeading}>Chapters</h2>
          <Badge mono>{count}</Badge>
        </CardHeader>
        <CardContent>
          <Timeline>{renderNode(props.chapters)}</Timeline>
        </CardContent>
      </Card>
    );
  },
});
