import { type SubmitEvent, useCallback, useRef } from "react";
import type { EpisodeMetadata, TokenUsage, WebSearchMode } from "@/agent";
import {
  Button,
  Card,
  CardContent,
  Flex,
  Input,
  Skeleton,
} from "@/components/ui";
import {
  YouTubePlayer,
  type YouTubePlayerHandle,
} from "@/components/YouTubePlayer";
import { TrustReportRenderer } from "@/openui";
import { formatDuration, formatTokenUsage } from "@/utils/format";
import styles from "./AgentRunner.module.css";

interface AgentRunnerProps {
  episodeUrl: string;
  onEpisodeUrlChange: (url: string) => void;
  activeVideoId: string | null;
  running: boolean;
  statusMessage: string | null;
  output: string;
  reportKey?: string | number;
  episodeMetadata: EpisodeMetadata | null;
  tokenUsage: TokenUsage | null;
  webSearchMode: WebSearchMode;
  webSearchCount: number | null;
  generationDurationMs: number | null;
  missingProxyInProd: boolean;
  missingConnection?: boolean;
  onRun: () => void;
  onCancel: () => void;
  onOpenSettings: () => void;
  onRenderError?: (message: string) => void;
}

function getWebSearchBadgeText(
  mode: WebSearchMode,
  count: number | null,
  running: boolean,
): string {
  const countSuffix =
    mode !== "none" && !running && count !== null
      ? ` (${count} ${count === 1 ? "query" : "queries"})`
      : "";

  switch (mode) {
    case "native": {
      return `Web search: Built-in${countSuffix}`;
    }
    case "exa": {
      return `Web search: Exa${countSuffix}`;
    }
    case "none": {
      return "Web search: Off (enable in Connection settings)";
    }
  }
}

export function AgentRunner({
  episodeUrl,
  onEpisodeUrlChange,
  activeVideoId,
  running,
  statusMessage,
  output,
  reportKey,
  episodeMetadata,
  tokenUsage,
  webSearchMode,
  webSearchCount,
  generationDurationMs,
  missingProxyInProd,
  missingConnection = false,
  onRun,
  onCancel,
  onOpenSettings,
  onRenderError,
}: AgentRunnerProps) {
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  const showSkeleton = running && !output;
  const isBlocked = running || missingProxyInProd || missingConnection;

  const handleSeekTimestamp = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
  }, []);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (missingProxyInProd || missingConnection) {
      return;
    }
    onRun();
  };

  const idleStatus = missingConnection
    ? "Add an AI Connection in Settings to generate new Trust Reports."
    : missingProxyInProd
      ? "Configure a CORS proxy or run locally to generate Trust Reports."
      : output
        ? null
        : "Enter an Episode URL to generate a Trust Report.";

  const reportContent = showSkeleton ? (
    <Card as="div">
      <CardContent>
        <Flex
          direction="column"
          gap={3}
          aria-busy="true"
          aria-live="polite"
        >
          <span className="visually-hidden">
            {statusMessage ?? "Generating Trust Report..."}
          </span>
          <Skeleton width="55%" height="1.25rem" />
          <Skeleton width="92%" />
          <Skeleton width="100%" />
          <Skeleton width="84%" />
          <Skeleton width="40%" height="1.25rem" />
          <Skeleton width="76%" />
        </Flex>
      </CardContent>
    </Card>
  ) : output ? (
    <div
      className={styles.reportRegion}
      aria-live="polite"
      aria-busy={running || undefined}
    >
      <TrustReportRenderer
        key={reportKey}
        response={output}
        isStreaming={running}
        metadata={episodeMetadata}
        onSeekTimestamp={activeVideoId ? handleSeekTimestamp : undefined}
        onFatalError={onRenderError}
      />
    </div>
  ) : (
    <Card as="div">
      <CardContent>
        <div className={styles.emptyState}>
          <span className={styles.emptyOutput}>No Trust Report yet.</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Flex as="section" direction="column" gap={4} aria-label="Trust Report Runner">
      <div className={styles.inputSection}>
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

            <span className={styles.webSearchInline}>
              {webSearchMode === "none" ? (
                <>
                  Web search: Off (
                  <button
                    type="button"
                    className={styles.settingsLink}
                    disabled={running}
                    onClick={onOpenSettings}
                  >
                    enable in Settings
                  </button>
                  )
                </>
              ) : (
                getWebSearchBadgeText(webSearchMode, webSearchCount, running)
              )}
            </span>
          </div>
        </form>

        <div className={styles.statusRow} role="status" aria-live="polite">
          <span className={statusMessage ? styles.statusText : undefined}>
            {statusMessage ?? idleStatus}
          </span>
          <div className={styles.statusMeta}>
            {!running && generationDurationMs !== null ? (
              <span className={styles.usageBadge}>
                Time: {formatDuration(generationDurationMs)}
              </span>
            ) : null}
            {!running && tokenUsage ? (
              <span className={styles.usageBadge}>
                {formatTokenUsage(tokenUsage)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.canvas}>
        {activeVideoId ? (
          <div className={styles.workspace}>
            <div className={styles.videoColumn}>
              <YouTubePlayer
                ref={playerRef}
                videoId={activeVideoId}
                title={episodeMetadata?.title}
              />
            </div>
            <div className={styles.reportColumn}>{reportContent}</div>
          </div>
        ) : (
          reportContent
        )}
      </div>
    </Flex>
  );
}
