import {
  type LanguageModelUsage,
  stepCountIs,
  streamText,
  type ToolSet,
} from "ai";
import { createProviderModel } from "./model";
import {
  buildEpisodePrompt,
  buildRepairPrompt,
  buildSystemPrompt,
} from "./prompt";
import type {
  RunTrustReportInput,
  RunTrustReportResult,
  TokenUsage,
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

interface RawUsageTotals {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

function toFiniteNonNegative(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

async function readUsageSafe(
  usagePromise: PromiseLike<LanguageModelUsage>,
): Promise<RawUsageTotals | null> {
  try {
    const usage = await usagePromise;
    const inputTokens = toFiniteNonNegative(usage.inputTokens);
    const outputTokens = toFiniteNonNegative(usage.outputTokens);
    const totalTokens =
      typeof usage.totalTokens === "number" &&
      Number.isFinite(usage.totalTokens) &&
      usage.totalTokens >= 0
        ? usage.totalTokens
        : inputTokens + outputTokens;

    if (inputTokens === 0 && outputTokens === 0 && totalTokens === 0) {
      return null;
    }

    return { inputTokens, outputTokens, totalTokens };
  } catch {
    return null;
  }
}

function extractGoogleSearchQueryCount(providerMetadata: unknown): number {
  if (typeof providerMetadata !== "object" || providerMetadata === null) {
    return 0;
  }
  if (!("google" in providerMetadata)) {
    return 0;
  }
  const google = providerMetadata.google;
  if (typeof google !== "object" || google === null) {
    return 0;
  }
  if (!("groundingMetadata" in google)) {
    return 0;
  }
  const grounding = google.groundingMetadata;
  if (typeof grounding !== "object" || grounding === null) {
    return 0;
  }
  if (!("webSearchQueries" in grounding)) {
    return 0;
  }
  const queries = grounding.webSearchQueries;
  if (!Array.isArray(queries)) {
    return 0;
  }
  return queries.filter((item) => typeof item === "string" && item.trim().length > 0)
    .length;
}

async function readGroundedSearchCountSafe(
  stepsPromise: PromiseLike<Array<{ providerMetadata?: unknown }>>,
  providerMetadataPromise: PromiseLike<unknown>,
): Promise<number> {
  try {
    const steps = await stepsPromise;
    let total = 0;
    for (const step of steps) {
      total += extractGoogleSearchQueryCount(step.providerMetadata);
    }
    if (total > 0) {
      return total;
    }
    return extractGoogleSearchQueryCount(await providerMetadataPromise);
  } catch {
    return 0;
  }
}

function formatSearchStatus(input: unknown): string {
  if (typeof input === "object" && input !== null) {
    if (
      "query" in input &&
      typeof input.query === "string" &&
      input.query.trim()
    ) {
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
  const startedAt = performance.now();
  const {
    episodeUrl,
    model,
    tools: toolsConfig,
    uiSystemPrompt,
    signal,
    onMetadata,
    onStatus,
    onText,
    validateUiOutput,
  } = input;

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

  onMetadata?.(metadata);

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
  let webSearchCount = 0;
  let buffer = "";

  const result = streamText({
    model: languageModel,
    system: buildSystemPrompt({ webSearchEnabled, uiSystemPrompt }),
    prompt: buildEpisodePrompt(metadata, transcript),
    ...(tools ? { tools } : {}),
    stopWhen: stepCountIs(webSearchEnabled ? 10 : 2),
    temperature: 0.1,
    abortSignal: signal,
    onError: ({ error }) => {
      streamError = error;
    },
  });

  for await (const part of result.fullStream) {
    if (part.type === "tool-call") {
      webSearchCount += 1;
      onStatus?.({
        stage: "searching-web",
        message: formatSearchStatus("input" in part ? part.input : undefined),
      });
    } else if (part.type === "source") {
      if (!emittedGeneratingText) {
        onStatus?.({
          stage: "searching-web",
          message: "Verifying Claims with web search...",
        });
      }
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

  const primaryUsage = await readUsageSafe(result.totalUsage);
  if (webSearchMode === "native" && webSearchCount === 0) {
    webSearchCount += await readGroundedSearchCountSafe(
      result.steps,
      result.providerMetadata,
    );
  }
  let repairUsage: RawUsageTotals | null = null;
  let repaired = false;

  if (uiSystemPrompt && validateUiOutput && buffer.trim().length > 0) {
    const initialValidation = validateUiOutput(buffer);
    if (!initialValidation.valid) {
      repaired = true;
      onStatus?.({
        stage: "repairing",
        message: "Fixing Trust Report formatting...",
      });

      let repairError: unknown = null;
      let repairedBuffer = "";

      const repairResult = streamText({
        model: languageModel,
        system: uiSystemPrompt,
        prompt: buildRepairPrompt(buffer, initialValidation.errors),
        temperature: 0,
        abortSignal: signal,
        onError: ({ error }) => {
          repairError = error;
        },
      });

      for await (const part of repairResult.fullStream) {
        if (part.type === "text-delta") {
          repairedBuffer += part.text;
          onText?.(repairedBuffer);
        } else if (part.type === "error") {
          repairError = part.error;
        }
      }

      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      repairUsage = await readUsageSafe(repairResult.totalUsage);

      if (!repairError && repairedBuffer.trim().length > 0) {
        const repairedValidation = validateUiOutput(repairedBuffer);
        const improved =
          repairedValidation.valid ||
          (repairedValidation.hasRoot && !initialValidation.hasRoot) ||
          (repairedValidation.hasRoot === initialValidation.hasRoot &&
            repairedValidation.errors.length <=
              initialValidation.errors.length);

        if (improved) {
          buffer = repairedBuffer;
        } else {
          onText?.(buffer);
        }
      } else {
        onText?.(buffer);
      }
    }
  }

  let usage: TokenUsage | null = null;
  if (primaryUsage || repairUsage) {
    const inputTokens =
      (primaryUsage?.inputTokens ?? 0) + (repairUsage?.inputTokens ?? 0);
    const outputTokens =
      (primaryUsage?.outputTokens ?? 0) + (repairUsage?.outputTokens ?? 0);
    const totalTokens =
      (primaryUsage?.totalTokens ?? 0) + (repairUsage?.totalTokens ?? 0);

    usage = {
      inputTokens,
      outputTokens,
      totalTokens,
      repairTokens: repairUsage?.totalTokens ?? 0,
      repaired,
    };
  }

  return {
    metadata,
    text: buffer,
    webSearchEnabled,
    webSearchMode,
    webSearchCount,
    durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
    usage,
  };
}
