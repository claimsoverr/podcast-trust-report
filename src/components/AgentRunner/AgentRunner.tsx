import type { SubmitEvent } from "react";
import type { WebSearchMode } from "@/agent";
import {
  Button,
  Card,
  CardContent,
  Flex,
  Input,
  Skeleton,
} from "@/components/ui";
import styles from "./AgentRunner.module.css";

interface AgentRunnerProps {
  episodeUrl: string;
  onEpisodeUrlChange: (url: string) => void;
  running: boolean;
  statusMessage: string | null;
  output: string;
  webSearchMode: WebSearchMode;
  missingProxyInProd: boolean;
  onRun: () => void;
  onCancel: () => void;
}

function getWebSearchBadgeText(mode: WebSearchMode): string {
  switch (mode) {
    case "native": {
      return "Web search: Built-in";
    }
    case "exa": {
      return "Web search: Exa";
    }
    case "none": {
      return "Web search: Off (enable in Connection settings)";
    }
  }
}

export function AgentRunner({
  episodeUrl,
  onEpisodeUrlChange,
  running,
  statusMessage,
  output,
  webSearchMode,
  missingProxyInProd,
  onRun,
  onCancel,
}: AgentRunnerProps) {
  const showSkeleton = running && !output;
  const isBlocked = running || missingProxyInProd;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (missingProxyInProd) {
      return;
    }
    onRun();
  };

  const idleStatus = missingProxyInProd
    ? "Configure a CORS proxy or run locally to generate Trust Reports."
    : output
      ? null
      : "Enter an Episode URL to generate a Trust Report.";

  return (
    <Flex as="section" direction="column" gap={4} aria-label="Trust Report Runner">
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <Input
          label="Episode URL"
          type="url"
          required
          disabled={isBlocked}
          placeholder="https://www.youtube.com/watch?v=..."
          hint="Paste a YouTube Episode link or 11-character video ID to generate a Trust Report."
          value={episodeUrl}
          onChange={(event) => onEpisodeUrlChange(event.target.value)}
        />

        <div className={styles.controls}>
          <Button
            type="submit"
            variant="primary"
            isLoading={running}
            disabled={isBlocked || !episodeUrl.trim()}
          >
            {running ? "Generating..." : "Generate Report"}
          </Button>

          {running ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className={styles.statusRow} role="status" aria-live="polite">
        <span className={statusMessage ? styles.statusText : undefined}>
          {statusMessage ?? idleStatus}
        </span>
        <span className={styles.hintBadge}>
          {getWebSearchBadgeText(webSearchMode)}
        </span>
      </div>

      <Card as="div">
        <CardContent>
          <output
            className={styles.output}
            aria-live="polite"
            aria-busy={showSkeleton || undefined}
          >
            {showSkeleton ? (
              <Flex direction="column" gap={2}>
                <span className="visually-hidden">
                  {statusMessage ?? "Generating Trust Report..."}
                </span>
                <Skeleton width="92%" />
                <Skeleton width="100%" />
                <Skeleton width="84%" />
                <Skeleton width="76%" />
              </Flex>
            ) : output ? (
              output
            ) : (
              <span className={styles.emptyOutput}>No Trust Report yet.</span>
            )}
          </output>
        </CardContent>
      </Card>
    </Flex>
  );
}
