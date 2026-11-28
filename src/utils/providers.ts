import type { AIProvider } from "@/agent";
import type { SelectOptionGroup } from "@/components/ui";

export type { AIProvider };

export type AIProviderGroup = "local" | "cloud";

export interface AIProviderLink {
  label: string;
  url: string;
}

export interface AIProviderUrlPreset {
  label: string;
  url: string;
}

export interface AIProviderRecommendedModel {
  id: string;
  label: string;
}

export interface AIProviderConfig {
  id: AIProvider;
  label: string;
  group: AIProviderGroup;
  requiresUrl: boolean;
  defaultUrl: string;
  urlLabel?: string;
  urlPlaceholder?: string;
  urlPresets?: readonly AIProviderUrlPreset[];
  supportsApiKey: boolean;
  requiresApiKey: boolean;
  apiKeyPlaceholder?: string;
  namePlaceholder: string;
  modelPlaceholder: string;
  recommendedModels?: readonly AIProviderRecommendedModel[];
  primaryLink: AIProviderLink;
  secondaryLink?: AIProviderLink;
  summary: string;
  privacyNote?: string;
  setupSteps: readonly string[];
}

export const DEFAULT_PROVIDER: AIProvider = "openai-compatible";

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  "openai-compatible": {
    id: "openai-compatible",
    label: "OpenAI-compatible",
    group: "local",
    requiresUrl: true,
    defaultUrl: "",
    urlLabel: "API URL",
    urlPlaceholder: "http://localhost:1235/v1",
    urlPresets: [
      { label: "LM Studio Bionic", url: "http://localhost:1235/v1" },
      { label: "LM Studio", url: "http://localhost:1234/v1" },
    ],
    supportsApiKey: true,
    requiresApiKey: false,
    apiKeyPlaceholder: "sk-...",
    namePlaceholder: "e.g. LM Studio Bionic",
    modelPlaceholder: "google/gemma-4-e2b",
    primaryLink: {
      label: "Download LM Studio Bionic",
      url: "https://lmstudio.ai",
    },
    secondaryLink: {
      label: "Bionic docs",
      url: "https://lmstudio.ai/docs/bionic",
    },
    summary:
      "Recommended for private local models with LM Studio Bionic. Also works with classic LM Studio, OpenRouter, Groq, or any OpenAI-compatible /v1 endpoint.",
    setupSteps: [
      "Download and launch LM Studio Bionic (or LM Studio) and load a model.",
      "Enable the local API server and turn on CORS so this browser app can connect.",
      "Use a preset URL below or enter a base URL ending in /v1.",
      "Leave API Key empty for local servers; only enter one for hosted endpoints that require Bearer auth.",
    ],
  },
  ollama: {
    id: "ollama",
    label: "Ollama",
    group: "local",
    requiresUrl: true,
    defaultUrl: "http://localhost:11434",
    urlLabel: "Ollama URL",
    urlPlaceholder: "http://localhost:11434",
    supportsApiKey: false,
    requiresApiKey: false,
    namePlaceholder: "e.g. Local Ollama",
    modelPlaceholder: "gemma4:e4b",
    primaryLink: {
      label: "Download Ollama",
      url: "https://ollama.com/download",
    },
    summary:
      "Run open-weight models locally on your machine with Ollama. Completely private and free to run with no API key required.",
    setupSteps: [
      "Install Ollama and pull a model in your terminal (for example: ollama pull gemma4:e4b).",
      "Keep Ollama running locally; its default server address is http://localhost:11434.",
      "If you open this app from a non-localhost origin, start Ollama with CORS enabled (OLLAMA_ORIGINS=\"*\").",
    ],
  },
  google: {
    id: "google",
    label: "Google Gemini",
    group: "cloud",
    requiresUrl: false,
    defaultUrl: "",
    supportsApiKey: true,
    requiresApiKey: true,
    apiKeyPlaceholder: "AIza...",
    namePlaceholder: "e.g. Gemini Flash",
    modelPlaceholder: "gemini-3.8-flash",
    recommendedModels: [
      { id: "gemini-3.8-flash", label: "Balanced" },
      { id: "gemini-3.5-flash-lite", label: "Fast" },
    ],
    primaryLink: {
      label: "Get a Gemini API key in Google AI Studio",
      url: "https://aistudio.google.com/apikey",
    },
    summary:
      "Fast cloud models with large context windows suited for long podcast transcripts. Requests go directly from your browser to Google.",
    setupSteps: [
      "Open Google AI Studio and create an API key.",
      "Paste the key below—no API URL is needed for Google Gemini.",
      "Pick a recommended model chip or refresh to browse models enabled for your key.",
      "Note: Gemini API usage and quotas are managed in Google AI Studio separately from consumer Gemini subscriptions.",
    ],
  },
  anthropic: {
    id: "anthropic",
    label: "Claude",
    group: "cloud",
    requiresUrl: false,
    defaultUrl: "",
    supportsApiKey: true,
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-ant-...",
    namePlaceholder: "e.g. Claude Sonnet",
    modelPlaceholder: "claude-sonnet-5-5",
    recommendedModels: [
      { id: "claude-sonnet-5-5", label: "Balanced" },
      { id: "claude-haiku-5-5", label: "Fast" },
    ],
    primaryLink: {
      label: "Create an API key in Anthropic Console",
      url: "https://console.anthropic.com/settings/keys",
    },
    summary:
      "Strong analytical writing and nuanced claim evaluation. Requests go directly from your browser to Anthropic using your own key.",
    privacyNote:
      "Direct browser access is enabled automatically for your own key, which stays only in this browser's localStorage.",
    setupSteps: [
      "Create an API key in the Anthropic Console.",
      "Paste the key below—no API URL is needed for Claude.",
      "Pick a recommended model chip or refresh to browse available models on your account.",
      "Note: API requests use Anthropic Console credits and are billed separately from Claude Pro or Max subscriptions.",
    ],
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    group: "cloud",
    requiresUrl: false,
    defaultUrl: "",
    supportsApiKey: true,
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    namePlaceholder: "e.g. OpenAI Sol",
    modelPlaceholder: "gpt-6.2-sol",
    recommendedModels: [
      { id: "gpt-6.2-sol", label: "Balanced" },
      { id: "gpt-6-luna", label: "Fast" },
    ],
    primaryLink: {
      label: "Create an API key in OpenAI Platform",
      url: "https://platform.openai.com/api-keys",
    },
    summary:
      "Reliable general-purpose cloud models with strong tool calling. Requests go directly from your browser to OpenAI.",
    setupSteps: [
      "Create an API key on the OpenAI Platform.",
      "Paste the key below—no API URL is needed for OpenAI.",
      "Pick a recommended model chip or refresh to browse models available to your key.",
      "Note: API usage requires OpenAI Platform billing and is separate from ChatGPT Plus subscriptions.",
    ],
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    group: "cloud",
    requiresUrl: false,
    defaultUrl: "",
    supportsApiKey: true,
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-or-...",
    namePlaceholder: "e.g. OpenRouter",
    modelPlaceholder: "google/gemini-3.8-flash",
    recommendedModels: [
      { id: "openrouter/auto", label: "Auto" },
      { id: "openrouter/free", label: "Auto Free" },
      { id: "google/gemini-3.8-flash", label: "Balanced" },
      { id: "anthropic/claude-sonnet-5-5", label: "Analytical" },
      { id: "z-ai/glm-5.3-flash", label: "GLM 5.3 Flash" },
      { id: "deepseek/deepseek-v4.1-flash-1017", label: "DeepSeek V4.1 Flash" },
    ],
    primaryLink: {
      label: "Create an API key in OpenRouter",
      url: "https://openrouter.ai/settings/keys",
    },
    summary:
      "Access hundreds of cloud models through one unified API key with built-in web search. Requests go directly from your browser to OpenRouter.",
    setupSteps: [
      "Create an API key in OpenRouter Settings.",
      "Paste the key below—no API URL is needed for OpenRouter.",
      "Pick a recommended model chip or refresh to browse available models.",
      "Note: Built-in web search uses your OpenRouter credits in addition to model token usage.",
    ],
  },
};

export const AI_PROVIDER_GROUPS: readonly SelectOptionGroup[] = [
  {
    label: "Local (Private)",
    options: [
      {
        value: "openai-compatible",
        label: AI_PROVIDERS["openai-compatible"].label,
      },
      {
        value: "ollama",
        label: AI_PROVIDERS.ollama.label,
      },
    ],
  },
  {
    label: "Cloud (API Key)",
    options: [
      {
        value: "google",
        label: AI_PROVIDERS.google.label,
      },
      {
        value: "anthropic",
        label: AI_PROVIDERS.anthropic.label,
      },
      {
        value: "openai",
        label: AI_PROVIDERS.openai.label,
      },
      {
        value: "openrouter",
        label: AI_PROVIDERS.openrouter.label,
      },
    ],
  },
];

export function isValidAIProvider(value: unknown): value is AIProvider {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(AI_PROVIDERS, value)
  );
}
