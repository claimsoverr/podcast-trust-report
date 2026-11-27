import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Flex } from "@/components/ui";
import { ChapterListOUID } from "./ChapterList";
import { ClaimListOUID } from "./ClaimList";
import { EpisodeSummaryOUID } from "./EpisodeSummary";
import { NoticeOUID } from "./Notice";
import { TrustScoreOUID } from "./TrustScore";
import { TrustSignalsOUID } from "./TrustSignals";

export const TrustReportOUID = defineComponent({
  name: "TrustReport",
  description:
    "Root Trust Report container holding report sections in order: optional Notice, EpisodeSummary, TrustScore, ChapterList, TrustSignals, and ClaimList.",
  props: z.object({
    children: z
      .array(
        z.union([
          NoticeOUID.ref,
          EpisodeSummaryOUID.ref,
          TrustScoreOUID.ref,
          ChapterListOUID.ref,
          ClaimListOUID.ref,
          TrustSignalsOUID.ref,
        ]),
      )
      .describe("Top-level Trust Report sections"),
  }),
  component: ({ props, renderNode }) => (
    <article aria-label="Trust Report">
      <Flex direction="column" gap={4}>
        {renderNode(props.children)}
      </Flex>
    </article>
  ),
});
