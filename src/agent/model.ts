import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel, ToolSet } from "ai";
import type { AgentModelConfig, AIProvider } from "./types";

export interface ProviderModelWithSearch {
  model: LanguageModel;
  nativeWebSearchTool: {
    name: string;
    tool: ToolSet[string];
  } | null;
}

function normalizeApiUrl(provider: AIProvider, apiUrl?: string): string {
  const trimmed = (apiUrl ?? "").trim().replace(/\/+$/, "");
  if (provider === "ollama") {
    return trimmed.replace(/\/v1$/i, "").replace(/\/+$/, "");
  }
  return trimmed;
}

function normalizeModelId(provider: AIProvider, modelId: string): string {
  const trimmed = modelId.trim();
  if (provider === "google") {
    return trimmed.replace(/^models\//i, "");
  }
  return trimmed;
}

export function createProviderModel(
  config: AgentModelConfig,
): ProviderModelWithSearch {
  const modelId = normalizeModelId(config.provider, config.modelId);
  const apiUrl = normalizeApiUrl(config.provider, config.apiUrl);
  const apiKey = (config.apiKey ?? "").trim();

  switch (config.provider) {
    case "openai-compatible": {
      const provider = createOpenAICompatible({
        name: "user-configured-ai",
        baseURL: apiUrl,
        includeUsage: true,
        ...(apiKey ? { apiKey } : {}),
      });
      return {
        model: provider(modelId),
        nativeWebSearchTool: null,
      };
    }
    case "ollama": {
      const provider = createOpenAICompatible({
        name: "ollama",
        baseURL: `${apiUrl}/v1`,
        includeUsage: true,
      });
      return {
        model: provider(modelId),
        nativeWebSearchTool: null,
      };
    }
    case "google": {
      const provider = createGoogleGenerativeAI({
        apiKey,
      });
      return {
        model: provider(modelId),
        nativeWebSearchTool: {
          name: "google_search",
          tool: provider.tools.googleSearch({}),
        },
      };
    }
    case "anthropic": {
      const provider = createAnthropic({
        apiKey,
        headers: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      return {
        model: provider(modelId),
        nativeWebSearchTool: {
          name: "web_search",
          tool: provider.tools.webSearch_20250305(),
        },
      };
    }
    case "openai": {
      const provider = createOpenAI({
        apiKey,
      });
      return {
        model: provider(modelId),
        nativeWebSearchTool: {
          name: "web_search",
          tool: provider.tools.webSearch(),
        },
      };
    }
    case "openrouter": {
      const provider = createOpenRouter({
        apiKey,
      });
      return {
        model: provider.chat(modelId),
        nativeWebSearchTool: {
          name: "web_search",
          tool: provider.tools.webSearch({ engine: "auto" }),
        },
      };
    }
  }
}

export function createLanguageModel(config: AgentModelConfig): LanguageModel {
  return createProviderModel(config).model;
}
