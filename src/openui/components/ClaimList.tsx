import { type ReactNode, useState } from "react";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Badge, Card, CardContent, CardHeader } from "@/components/ui";
import {
  CLAIM_SPEAKER_ROLES,
  ClaimCardOUID,
  type ClaimSpeakerRole,
  normalizeSpeakerRole,
  normalizeVerdict,
} from "./ClaimCard";
import { ClaimFilterProvider } from "./ClaimFilterContext";
import styles from "./ClaimList.module.css";
import sharedStyles from "./ReportPrimitives.module.css";

function getClaimPropString(node: unknown, key: string): string | undefined {
  if (
    typeof node === "object" &&
    node !== null &&
    "props" in node &&
    typeof node.props === "object" &&
    node.props !== null &&
    key in node.props
  ) {
    const value = (node.props as Record<string, unknown>)[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return undefined;
}

function extractClaimVerdictCounts(claims: unknown[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const node of claims) {
    const rawVerdict = getClaimPropString(node, "verdict");
    if (rawVerdict !== undefined) {
      const verdict = normalizeVerdict(rawVerdict);
      counts.set(verdict, (counts.get(verdict) ?? 0) + 1);
    }
  }

  return counts;
}

function extractClaimSpeakerCounts(
  claims: unknown[],
): Map<ClaimSpeakerRole, number> {
  const counts = new Map<ClaimSpeakerRole, number>();

  for (const node of claims) {
    const speakerRole = normalizeSpeakerRole(getClaimPropString(node, "speaker"));
    if (speakerRole !== null) {
      counts.set(speakerRole, (counts.get(speakerRole) ?? 0) + 1);
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
  const [selectedSpeaker, setSelectedSpeaker] =
    useState<ClaimSpeakerRole | null>(null);

  const claimNodes = Array.isArray(claims) ? claims.filter(Boolean) : [];
  const totalCount = claimNodes.length;
  const verdictCounts = extractClaimVerdictCounts(claimNodes);
  const speakerCounts = extractClaimSpeakerCounts(claimNodes);

  const activeVerdict =
    selectedVerdict !== null && verdictCounts.has(selectedVerdict)
      ? selectedVerdict
      : null;
  const activeSpeaker =
    selectedSpeaker !== null && speakerCounts.has(selectedSpeaker)
      ? selectedSpeaker
      : null;

  const verdicts = Array.from(verdictCounts.entries());
  const speakers = CLAIM_SPEAKER_ROLES.filter((role) => speakerCounts.has(role));

  const visibleCount = claimNodes.filter((node) => {
    const rawVerdict = getClaimPropString(node, "verdict");
    const verdict = normalizeVerdict(rawVerdict);
    const speakerRole = normalizeSpeakerRole(getClaimPropString(node, "speaker"));

    if (activeVerdict !== null && activeVerdict !== verdict) {
      return false;
    }
    if (activeSpeaker !== null && activeSpeaker !== speakerRole) {
      return false;
    }
    return true;
  }).length;

  const showSpeakerFilter = speakers.length > 1;
  const showVerdictFilter = verdicts.length > 1;

  return (
    <Card>
      <CardHeader>
        <h2 className={sharedStyles.sectionHeading}>Fact-Checked Claims</h2>
        <Badge mono>{totalCount}</Badge>
      </CardHeader>
      <CardContent>
        {showSpeakerFilter || showVerdictFilter ? (
          <div className={styles.filterGroups}>
            {showSpeakerFilter ? (
              <div
                className={styles.filterBar}
                role="group"
                aria-label="Filter claims by speaker"
              >
                <button
                  type="button"
                  className={styles.filterChip}
                  aria-pressed={activeSpeaker === null}
                  onClick={() => setSelectedSpeaker(null)}
                >
                  All speakers{" "}
                  <span className={styles.chipCount}>({totalCount})</span>
                </button>
                {speakers.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={styles.filterChip}
                    aria-pressed={activeSpeaker === role}
                    onClick={() =>
                      setSelectedSpeaker((current) =>
                        current === role ? null : role,
                      )
                    }
                  >
                    {role}{" "}
                    <span className={styles.chipCount}>
                      ({speakerCounts.get(role) ?? 0})
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {showVerdictFilter ? (
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
          </div>
        ) : null}

        <ClaimFilterProvider value={{ activeVerdict, activeSpeaker }}>
          {totalCount > 0 && visibleCount === 0 ? (
            <p className={sharedStyles.mutedText}>
              No claims match the selected filters.
            </p>
          ) : (
            <div className={styles.list}>{renderNode(claims)}</div>
          )}
        </ClaimFilterProvider>
      </CardContent>
    </Card>
  );
}

export const ClaimListOUID = defineComponent({
  name: "ClaimList",
  description:
    "Displays the Episode's fact-checked Claims with interactive speaker and Verdict filters.",
  props: z.object({
    claims: z
      .array(ClaimCardOUID.ref)
      .describe("List of ClaimCard components"),
  }),
  component: ({ props, renderNode }) => (
    <ClaimListView claims={props.claims} renderNode={renderNode} />
  ),
});
