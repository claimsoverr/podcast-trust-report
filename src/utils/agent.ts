import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { type LanguageModel, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import {
  type AIConnection,
  normalizeConnectionInput,
  validateAIConnection,
} from "@/utils/settings";

const sampleTools = {
  getSampleInfo: tool({
    description:
      "Returns a sample podcast episode metadata payload to verify tool execution.",
    inputSchema: z.object({
      topic: z.string().describe("Topic label to include in the sample."),
    }),
    execute: async ({ topic }) => {
      return {
        topic,
        podcast: "Sample Podcast",
        episodeTitle: "Verifying Client-Side Agent Tool Calls",
        durationMinutes: 42,
        verifiedAt: new Date().toISOString(),
      };
    },
  }),
};

function createLanguageModel(connection: AIConnection): LanguageModel {
  const normalized = normalizeConnectionInput(connection);

  switch (normalized.provider) {
    case "openai-compatible": {
      const provider = createOpenAICompatible({
        name: "user-configured-ai",
        baseURL: normalized.apiUrl,
        ...(normalized.apiKey ? { apiKey: normalized.apiKey } : {}),
      });
      return provider(normalized.modelId);
    }
    case "ollama": {
      const provider = createOpenAICompatible({
        name: "ollama",
        baseURL: `${normalized.apiUrl}/v1`,
      });
      return provider(normalized.modelId);
    }
    case "google": {
      const provider = createGoogleGenerativeAI({
        apiKey: normalized.apiKey,
      });
      return provider(normalized.modelId);
    }
    case "anthropic": {
      const provider = createAnthropic({
        apiKey: normalized.apiKey,
        headers: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      return provider(normalized.modelId);
    }
    case "openai": {
      const provider = createOpenAI({
        apiKey: normalized.apiKey,
      });
      return provider(normalized.modelId);
    }
  }
}

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
  return "Failed to run the agent.";
}

export async function runSampleAgent(
  connection: AIConnection,
  onChunk: (textSoFar: string) => void,
): Promise<void> {
  const validation = await validateAIConnection(connection);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let streamError: unknown = null;

  const { textStream } = streamText({
    model: createLanguageModel(connection),
    system:
      "You are a minimal verification agent. Always call the getSampleInfo tool once, then summarize the returned fields in 2–3 concise sentences.",
    prompt: "Fetch sample info for topic 'client-side-agent' and summarize it.",
    tools: sampleTools,
    stopWhen: stepCountIs(3),
    temperature: 0.1,
    onError: ({ error }) => {
      streamError = error;
    },
  });

  let buffer = "";
  for await (const delta of textStream) {
    buffer += delta;
    onChunk(buffer);
  }

  if (streamError) {
    throw new Error(extractErrorMessage(streamError));
  }
}
