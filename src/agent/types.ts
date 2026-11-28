export type AIProvider =
  | "openai-compatible"
  | "ollama"
  | "google"
  | "anthropic"
  | "openai"
  | "openrouter";

export type WebSearchMode = "native" | "exa" | "none";

export interface AgentModelConfig {
  provider: AIProvider;
  apiUrl?: string;
  apiKey?: string;
  modelId: string;
}

export interface AgentToolsConfig {
  corsProxyUrl: string;
  webSearch: {
    enabled: boolean;
    exaApiKey?: string;
  };
}

export interface EpisodeMetadata {
  videoId: string;
  title: string;
  author: string;
  description: string;
  durationSeconds: number;
  durationFormatted: string;
}

export interface EpisodeTranscript {
  videoId: string;
  transcript: string;
  segmentCount: number;
  durationFormatted: string;
}

export type AgentStatusStage =
  | "fetching-metadata"
  | "fetching-transcript"
  | "searching-web"
  | "generating"
  | "repairing";

export interface AgentStatusEvent {
  stage: AgentStatusStage;
  message: string;
}

export interface UiOutputValidationResult {
  valid: boolean;
  hasRoot: boolean;
  errors: string[];
}

export interface RunTrustReportInput {
  episodeUrl: string;
  model: AgentModelConfig;
  tools: AgentToolsConfig;
  uiSystemPrompt?: string;
  signal?: AbortSignal;
  onMetadata?: (metadata: EpisodeMetadata) => void;
  onStatus?: (status: AgentStatusEvent) => void;
  onText?: (textSoFar: string) => void;
  validateUiOutput?: (raw: string) => UiOutputValidationResult;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  repairTokens: number;
  repaired: boolean;
}

export interface RunTrustReportResult {
  metadata: EpisodeMetadata;
  text: string;
  webSearchEnabled: boolean;
  webSearchMode: WebSearchMode;
  webSearchCount: number;
  durationMs: number;
  usage: TokenUsage | null;
}
