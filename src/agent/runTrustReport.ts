import { stepCountIs, streamText, type ToolSet } from "ai";
import { createProviderModel } from "./model";
import { buildEpisodePrompt, buildSystemPrompt } from "./prompt";
import type {
  RunTrustReportInput,
  RunTrustReportResult,
  WebSearchMode,
} from "./types";
import { createWebSearchTool } from "./webSearch";
import { fetchEpisodeData } from "./youtube";

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "error" in err &&
    err.error instanceof Error &&
    err.error.message
  ) {
    return err.error.message;
  }
  return "Failed to generate Trust Report.";
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

function formatSearchStatus(input: unknown): string {
  if (typeof input === "object" && input !== null) {
    if ("query" in input && typeof input.query === "string" && input.query.trim()) {
      return `Searching web: "${input.query.trim()}"...`;
    }
    if (
      "queries" in input &&
      Array.isArray(input.queries) &&
      typeof input.queries[0] === "string" &&
      input.queries[0].trim()
    ) {
      return `Searching web: "${input.queries[0].trim()}"...`;
    }
  }
  return "Searching web for claim verification...";
}

export async function runTrustReport(
  input: RunTrustReportInput,
): Promise<RunTrustReportResult> {
  const { episodeUrl, model, tools: toolsConfig, signal, onStatus, onText } =
    input;

  onStatus?.({
    stage: "fetching-metadata",
    message: "Fetching Episode metadata...",
  });

  const { metadata, transcript } = await fetchEpisodeData({
    episodeUrl,
    corsProxyUrl: toolsConfig.corsProxyUrl,
    signal,
    onBeforeTranscript: () => {
      onStatus?.({
        stage: "fetching-transcript",
        message: "Fetching Episode transcript...",
      });
    },
  });

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const { model: languageModel, nativeWebSearchTool } =
    createProviderModel(model);

  let tools: ToolSet | undefined;
  let webSearchMode: WebSearchMode = "none";

  if (toolsConfig.webSearch.enabled) {
    if (nativeWebSearchTool !== null) {
      tools = {
        [nativeWebSearchTool.name]: nativeWebSearchTool.tool,
      };
      webSearchMode = "native";
    } else {
      const exaApiKey = (toolsConfig.webSearch.exaApiKey ?? "").trim();
      if (exaApiKey.length > 0) {
        tools = {
          webSearch: createWebSearchTool({
            apiKey: exaApiKey,
            corsProxyUrl: toolsConfig.corsProxyUrl,
            signal,
          }),
        };
        webSearchMode = "exa";
      }
    }
  }

  const webSearchEnabled = webSearchMode !== "none";

  onStatus?.({
    stage: "generating",
    message: webSearchEnabled
      ? "Analyzing Episode and verifying Claims..."
      : "Generating Trust Report...",
  });

  let streamError: unknown = null;
  let emittedGeneratingText = false;
  let buffer = "";

  const result = streamText({
    model: languageModel,
    system: buildSystemPrompt({ webSearchEnabled }),
    prompt: buildEpisodePrompt(metadata, transcript),
    ...(tools ? { tools } : {}),
    stopWhen: stepCountIs(webSearchEnabled ? 10 : 2),
    temperature: 0.2,
    abortSignal: signal,
    onError: ({ error }) => {
      streamError = error;
    },
  });

  for await (const part of result.fullStream) {
    if (part.type === "tool-call") {
      onStatus?.({
        stage: "searching-web",
        message: formatSearchStatus("input" in part ? part.input : undefined),
      });
    } else if (part.type === "text-delta") {
      if (!emittedGeneratingText) {
        emittedGeneratingText = true;
        onStatus?.({
          stage: "generating",
          message: "Generating Trust Report...",
        });
      }
      buffer += part.text;
      onText?.(buffer);
    } else if (part.type === "error") {
      streamError = part.error;
    }
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (streamError) {
    if (isAbortError(streamError)) {
      throw streamError;
    }
    throw new Error(extractErrorMessage(streamError));
  }

  return {
    metadata,
    text: buffer,
    webSearchEnabled,
    webSearchMode,
  };
}
