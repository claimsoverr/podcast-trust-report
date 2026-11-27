import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Alert, type AlertVariant } from "@/components/ui";
import sharedStyles from "./ReportPrimitives.module.css";

function normalizeNoticeVariant(value: string | undefined): AlertVariant {
  const normalized = (value ?? "").trim().toLowerCase();
  switch (normalized) {
    case "warning":
    case "danger":
    case "success":
    case "info": {
      return normalized;
    }
    default: {
      return "info";
    }
  }
}

export const NoticeOUID = defineComponent({
  name: "Notice",
  description:
    "Displays a notice or caveat banner (for example, when web search is disabled).",
  props: z.object({
    variant: z
      .string()
      .describe('Tone: "info", "warning", "danger", or "success"'),
    message: z.string().describe("Notice message text"),
  }),
  component: ({ props }) => (
    <Alert variant={normalizeNoticeVariant(props.variant)}>
      <p className={sharedStyles.bodyText}>{props.message ?? ""}</p>
    </Alert>
  ),
});
