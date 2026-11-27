import { type ReactNode, useState } from "react";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Badge, Card, CardContent, CardHeader } from "@/components/ui";
import { ClaimCardOUID, normalizeVerdict } from "./ClaimCard";
import { ClaimFilterProvider } from "./ClaimFilterContext";
import styles from "./ClaimList.module.css";
import sharedStyles from "./ReportPrimitives.module.css";

function extractClaimVerdictCounts(claims: unknown[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const node of claims) {
    if (
      typeof node === "object" &&
      node !== null &&
      "props" in node &&
      typeof node.props === "object" &&
      node.props !== null &&
      "verdict" in node.props &&
      typeof node.props.verdict === "string"
    ) {
      const verdict = normalizeVerdict(node.props.verdict);
      counts.set(verdict, (counts.get(verdict) ?? 0) + 1);
    }
  }

  return counts;
}

function ClaimListView({
  claims,
  renderNode,
}: {
  claims: unknown[];
  renderNode: (value: unknown) => ReactNode;
}) {
  const [selectedVerdict, setSelectedVerdict] = useState<string | null>(null);

  const claimNodes = Array.isArray(claims) ? claims.filter(Boolean) : [];
  const totalCount = claimNodes.length;
  const verdictCounts = extractClaimVerdictCounts(claimNodes);

  const activeVerdict =
    selectedVerdict !== null && verdictCounts.has(selectedVerdict)
      ? selectedVerdict
      : null;

  const verdicts = Array.from(verdictCounts.entries());

  return (
    <Card>
      <CardHeader>
        <h2 className={sharedStyles.sectionHeading}>Fact-Checked Claims</h2>
        <Badge mono>{totalCount}</Badge>
      </CardHeader>
      <CardContent>
        {verdicts.length > 1 ? (
          <div
            className={styles.filterBar}
            role="group"
            aria-label="Filter claims by verdict"
          >
            <button
              type="button"
              className={styles.filterChip}
              aria-pressed={activeVerdict === null}
              onClick={() => setSelectedVerdict(null)}
            >
              All <span className={styles.chipCount}>({totalCount})</span>
            </button>
            {verdicts.map(([verdict, count]) => (
              <button
                key={verdict}
                type="button"
                className={styles.filterChip}
                aria-pressed={activeVerdict === verdict}
                onClick={() =>
                  setSelectedVerdict((current) =>
                    current === verdict ? null : verdict,
                  )
                }
              >
                {verdict} <span className={styles.chipCount}>({count})</span>
              </button>
            ))}
          </div>
        ) : null}

        <ClaimFilterProvider value={{ activeVerdict }}>
          <div className={styles.list}>{renderNode(claims)}</div>
        </ClaimFilterProvider>
      </CardContent>
    </Card>
  );
}

export const ClaimListOUID = defineComponent({
  name: "ClaimList",
  description:
    "Displays the Episode's fact-checked Claims with interactive Verdict filters.",
  props: z.object({
    claims: z
      .array(ClaimCardOUID.ref)
      .describe("List of ClaimCard components"),
  }),
  component: ({ props, renderNode }) => (
    <ClaimListView claims={props.claims} renderNode={renderNode} />
  ),
});
