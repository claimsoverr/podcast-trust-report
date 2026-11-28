import type {
  AIProvider,
  EpisodeMetadata,
  TokenUsage,
  WebSearchMode,
} from "@/agent";
import { isValidAIProvider } from "@/utils/providers";

export interface SavedTrustReport {
  id: string;
  savedAt: string;
  episodeUrl: string;
  metadata: EpisodeMetadata;
  output: string;
  connectionName: string;
  provider: AIProvider;
  modelId: string;
  webSearchMode: WebSearchMode;
  webSearchCount: number | null;
  durationMs: number | null;
  usage: TokenUsage | null;
}

export type SavedTrustReportInput = Omit<SavedTrustReport, "id" | "savedAt">;

const STORAGE_KEY = "podcast-trust-report:report-history";

function createReportId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidWebSearchMode(value: unknown): value is WebSearchMode {
  return value === "native" || value === "exa" || value === "none";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseMetadata(value: unknown): EpisodeMetadata | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Partial<EpisodeMetadata>;
  if (
    typeof record.videoId !== "string" ||
    !record.videoId.trim() ||
    typeof record.title !== "string" ||
    !record.title.trim() ||
    typeof record.author !== "string" ||
    typeof record.description !== "string" ||
    !isFiniteNumber(record.durationSeconds) ||
    typeof record.durationFormatted !== "string"
  ) {
    return null;
  }

  return {
    videoId: record.videoId,
    title: record.title,
    author: record.author,
    description: record.description,
    durationSeconds: record.durationSeconds,
    durationFormatted: record.durationFormatted,
  };
}

function parseTokenUsage(value: unknown): TokenUsage | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const record = value as Partial<TokenUsage>;
  if (
    !isFiniteNumber(record.inputTokens) ||
    !isFiniteNumber(record.outputTokens) ||
    !isFiniteNumber(record.totalTokens) ||
    !isFiniteNumber(record.repairTokens) ||
    typeof record.repaired !== "boolean"
  ) {
    return null;
  }

  return {
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    totalTokens: record.totalTokens,
    repairTokens: record.repairTokens,
    repaired: record.repaired,
  };
}

export function parseStoredReport(entry: unknown): SavedTrustReport | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  const record = entry as Partial<SavedTrustReport>;
  if (
    typeof record.id !== "string" ||
    !record.id.trim() ||
    typeof record.savedAt !== "string" ||
    !record.savedAt.trim() ||
    typeof record.episodeUrl !== "string" ||
    !record.episodeUrl.trim() ||
    typeof record.output !== "string" ||
    !record.output.trim() ||
    typeof record.connectionName !== "string" ||
    !record.connectionName.trim() ||
    !isValidAIProvider(record.provider) ||
    typeof record.modelId !== "string" ||
    !record.modelId.trim() ||
    !isValidWebSearchMode(record.webSearchMode)
  ) {
    return null;
  }

  const metadata = parseMetadata(record.metadata);
  if (!metadata) {
    return null;
  }

  const webSearchCount =
    record.webSearchCount === null || record.webSearchCount === undefined
      ? null
      : isFiniteNumber(record.webSearchCount)
        ? record.webSearchCount
        : null;

  const durationMs =
    record.durationMs === null || record.durationMs === undefined
      ? null
      : isFiniteNumber(record.durationMs)
        ? record.durationMs
        : null;

  return {
    id: record.id.trim(),
    savedAt: record.savedAt,
    episodeUrl: record.episodeUrl,
    metadata,
    output: record.output,
    connectionName: record.connectionName.trim(),
    provider: record.provider,
    modelId: record.modelId.trim(),
    webSearchMode: record.webSearchMode,
    webSearchCount,
    durationMs,
    usage: parseTokenUsage(record.usage),
  };
}

function compareNewestFirst(a: SavedTrustReport, b: SavedTrustReport): number {
  const timeA = Date.parse(a.savedAt);
  const timeB = Date.parse(b.savedAt);
  if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
    return b.savedAt.localeCompare(a.savedAt);
  }
  return timeB - timeA;
}

export function loadReportHistory(): SavedTrustReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(parseStoredReport)
      .filter((item): item is SavedTrustReport => item !== null)
      .sort(compareNewestFirst);
  } catch {
    return [];
  }
}

export function saveReportHistory(
  entries: readonly SavedTrustReport[],
): { saved: SavedTrustReport[]; prunedCount: number } {
  const candidate = [...entries];
  let prunedCount = 0;

  while (candidate.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
      return { saved: candidate, prunedCount };
    } catch {
      candidate.pop();
      prunedCount += 1;
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch {
    return { saved: [], prunedCount: entries.length };
  }

  return { saved: [], prunedCount: entries.length };
}

export function addReportHistoryEntry(
  entries: readonly SavedTrustReport[],
  input: SavedTrustReportInput,
): {
  entry: SavedTrustReport;
  entries: SavedTrustReport[];
  prunedCount: number;
} {
  const entry: SavedTrustReport = {
    id: createReportId(),
    savedAt: new Date().toISOString(),
    ...input,
  };

  const { saved, prunedCount } = saveReportHistory([entry, ...entries]);
  return { entry, entries: saved, prunedCount };
}

export function deleteReportHistoryEntry(
  entries: readonly SavedTrustReport[],
  id: string,
): SavedTrustReport[] {
  const remaining = entries.filter((entry) => entry.id !== id);
  const { saved } = saveReportHistory(remaining);
  return saved;
}

export function clearReportHistory(): SavedTrustReport[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    return [];
  }
  return [];
}
