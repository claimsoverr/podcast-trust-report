export type AIProvider =
  | "openai-compatible"
  | "ollama"
  | "google"
  | "anthropic"
  | "openai";

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
  | "generating";

export interface AgentStatusEvent {
  stage: AgentStatusStage;
  message: string;
}

export interface RunTrustReportInput {
  episodeUrl: string;
  model: AgentModelConfig;
  tools: AgentToolsConfig;
  signal?: AbortSignal;
  onStatus?: (status: AgentStatusEvent) => void;
  onText?: (textSoFar: string) => void;
}

export interface RunTrustReportResult {
  metadata: EpisodeMetadata;
  text: string;
  webSearchEnabled: boolean;
  webSearchMode: WebSearchMode;
}
