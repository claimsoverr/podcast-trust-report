import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import { type AISettings, validateAISettings } from "@/utils/settings";

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
  settings: AISettings,
  onChunk: (textSoFar: string) => void,
): Promise<void> {
  const validation = await validateAISettings(settings);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const cleanApiKey = settings.apiKey.trim();
  const provider = createOpenAICompatible({
    name: "user-configured-ai",
    baseURL: settings.apiUrl.trim().replace(/\/+$/, ""),
    ...(cleanApiKey ? { apiKey: cleanApiKey } : {}),
  });

  let streamError: unknown = null;

  const { textStream } = streamText({
    model: provider(settings.modelId.trim()),
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
