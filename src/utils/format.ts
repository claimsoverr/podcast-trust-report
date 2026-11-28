import type { TokenUsage, WebSearchMode } from "@/agent";

const numberFormatter = new Intl.NumberFormat();

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDuration(durationMs: number): string {
  const totalSeconds = durationMs / 1000;
  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }
  const wholeSeconds = Math.round(totalSeconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatTokenUsage(usage: TokenUsage): string {
  const total = numberFormatter.format(usage.totalTokens);
  const input = numberFormatter.format(usage.inputTokens);
  const output = numberFormatter.format(usage.outputTokens);
  const repairSuffix =
    usage.repaired && usage.repairTokens > 0
      ? ` · incl. ${numberFormatter.format(usage.repairTokens)} repair`
      : "";

  return `Tokens: ${total} (${input} in · ${output} out${repairSuffix})`;
}

export function formatTokenCount(totalTokens: number): string {
  return `${numberFormatter.format(totalTokens)} tokens`;
}

export function formatSavedTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return isoTimestamp;
  }
  return timestampFormatter.format(date);
}

export function formatWebSearchSummary(
  mode: WebSearchMode,
  count: number | null,
): string {
  const countSuffix = count !== null ? ` (${count})` : "";

  switch (mode) {
    case "native": {
      return `Built-in${countSuffix}`;
    }
    case "exa": {
      return `Exa${countSuffix}`;
    }
    case "none": {
      return "Off";
    }
  }
}
