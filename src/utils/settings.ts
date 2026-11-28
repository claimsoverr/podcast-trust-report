import type { WebSearchMode } from "@/agent";
import {
  AI_PROVIDERS,
  type AIProvider,
  isValidAIProvider,
} from "@/utils/providers";

export interface AIConnectionTools {
  webSearch: {
    enabled: boolean;
    exaApiKey: string;
  };
}

export interface AIConnectionInput {
  name: string;
  provider: AIProvider;
  apiUrl: string;
  apiKey: string;
  modelId: string;
  tools: AIConnectionTools;
}

export interface AIConnection extends AIConnectionInput {
  id: string;
}

export function createDefaultConnectionTools(
  provider: AIProvider,
): AIConnectionTools {
  const isCloud = AI_PROVIDERS[provider].group === "cloud";
  return {
    webSearch: {
      enabled: isCloud,
      exaApiKey: "",
    },
  };
}

export function getConnectionWebSearchMode(
  connection: AIConnection,
): WebSearchMode {
  if (!connection.tools.webSearch.enabled) {
    return "none";
  }

  if (AI_PROVIDERS[connection.provider].group === "cloud") {
    return "native";
  }

  return connection.tools.webSearch.exaApiKey.trim().length > 0
    ? "exa"
    : "none";
}

export interface AISettings {
  activeConnectionId: string | null;
  connections: AIConnection[];
}

const STORAGE_KEY = "podcast-trust-report:ai-settings";

export const DEFAULT_AI_SETTINGS: AISettings = {
  activeConnectionId: null,
  connections: [],
};

function normalizeProviderUrl(provider: AIProvider, apiUrl: string): string {
  const config = AI_PROVIDERS[provider];
  if (!config.requiresUrl) {
    return "";
  }

  const trimmed = apiUrl.trim().replace(/\/+$/, "");
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

export function normalizeConnectionInput(
  input: AIConnectionInput,
): AIConnectionInput {
  const provider = isValidAIProvider(input.provider)
    ? input.provider
    : "openai-compatible";
  const config = AI_PROVIDERS[provider];
  const isLocal = config.group === "local";

  return {
    name: input.name.trim(),
    provider,
    apiUrl: normalizeProviderUrl(provider, input.apiUrl),
    apiKey: config.supportsApiKey ? input.apiKey.trim() : "",
    modelId: normalizeModelId(provider, input.modelId),
    tools: {
      webSearch: {
        enabled: Boolean(input.tools.webSearch.enabled),
        exaApiKey: isLocal ? input.tools.webSearch.exaApiKey.trim() : "",
      },
    },
  };
}

function createConnectionId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `conn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseStoredConnection(entry: unknown): AIConnection | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  const record = entry as Partial<AIConnection>;
  if (
    typeof record.id !== "string" ||
    !record.id.trim() ||
    !isValidAIProvider(record.provider) ||
    typeof record.name !== "string" ||
    typeof record.modelId !== "string"
  ) {
    return null;
  }

  const defaultTools = createDefaultConnectionTools(record.provider);
  const rawTools =
    typeof record.tools === "object" && record.tools !== null
      ? (record.tools as Partial<AIConnectionTools>)
      : undefined;
  const rawWebSearch =
    rawTools &&
    typeof rawTools.webSearch === "object" &&
    rawTools.webSearch !== null
      ? (rawTools.webSearch as Partial<AIConnectionTools["webSearch"]>)
      : undefined;

  const normalized = normalizeConnectionInput({
    name: record.name,
    provider: record.provider,
    apiUrl: typeof record.apiUrl === "string" ? record.apiUrl : "",
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
    modelId: record.modelId,
    tools: {
      webSearch: {
        enabled:
          typeof rawWebSearch?.enabled === "boolean"
            ? rawWebSearch.enabled
            : defaultTools.webSearch.enabled,
        exaApiKey:
          typeof rawWebSearch?.exaApiKey === "string"
            ? rawWebSearch.exaApiKey
            : defaultTools.webSearch.exaApiKey,
      },
    },
  });

  if (!normalized.name || !normalized.modelId) {
    return null;
  }

  return {
    id: record.id.trim(),
    ...normalized,
  };
}

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_AI_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AISettings>;
    if (!parsed || !Array.isArray(parsed.connections)) {
      return DEFAULT_AI_SETTINGS;
    }

    const connections = parsed.connections
      .map(parseStoredConnection)
      .filter((item): item is AIConnection => item !== null);

    if (connections.length === 0) {
      return DEFAULT_AI_SETTINGS;
    }

    const activeExists =
      typeof parsed.activeConnectionId === "string" &&
      connections.some((conn) => conn.id === parsed.activeConnectionId);

    return {
      activeConnectionId: activeExists
        ? (parsed.activeConnectionId as string)
        : connections[0].id,
      connections,
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: AISettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getActiveConnection(settings: AISettings): AIConnection | null {
  if (settings.connections.length === 0) {
    return null;
  }

  if (settings.activeConnectionId) {
    const active = settings.connections.find(
      (conn) => conn.id === settings.activeConnectionId,
    );
    if (active) {
      return active;
    }
  }

  return settings.connections[0];
}

export function addConnection(
  settings: AISettings,
  input: AIConnectionInput,
): AISettings {
  const normalized = normalizeConnectionInput(input);
  const nextConnection: AIConnection = {
    id: createConnectionId(),
    ...normalized,
  };

  return {
    activeConnectionId: nextConnection.id,
    connections: [...settings.connections, nextConnection],
  };
}

export function updateConnection(
  settings: AISettings,
  id: string,
  input: AIConnectionInput,
): AISettings {
  const normalized = normalizeConnectionInput(input);
  return {
    ...settings,
    connections: settings.connections.map((conn) => {
      if (conn.id !== id) {
        return conn;
      }
      return {
        id: conn.id,
        ...normalized,
      };
    }),
  };
}

export function deleteConnection(settings: AISettings, id: string): AISettings {
  const remaining = settings.connections.filter((conn) => conn.id !== id);
  const nextActiveId =
    settings.activeConnectionId === id
      ? (remaining[0]?.id ?? null)
      : settings.activeConnectionId;

  return {
    activeConnectionId: nextActiveId,
    connections: remaining,
  };
}

export function setActiveConnection(
  settings: AISettings,
  id: string,
): AISettings {
  const exists = settings.connections.some((conn) => conn.id === id);
  if (!exists) {
    return settings;
  }

  return {
    ...settings,
    activeConnectionId: id,
  };
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface OpenAIModelsResponse {
  data?: Array<{
    id?: string;
  }>;
}

interface OllamaTagsResponse {
  models?: Array<{
    name?: string;
    model?: string;
  }>;
}

interface GoogleModelsResponse {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
}

type FetchModelsResult =
  | { ok: true; models: string[] }
  | { ok: false; error: string };

function uniqueSortedOrPreserved(ids: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      ids.filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );
}

async function fetchOpenAICompatibleModels(
  apiUrl: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<FetchModelsResult> {
  const cleanUrl = normalizeProviderUrl("openai-compatible", apiUrl);
  const cleanApiKey = apiKey.trim();

  if (!cleanUrl || !isValidHttpUrl(cleanUrl)) {
    return {
      ok: false,
      error: "Please enter a valid API URL (e.g. http://localhost:1235/v1).",
    };
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (cleanApiKey) {
    headers.Authorization = `Bearer ${cleanApiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(`${cleanUrl}/models`, {
      method: "GET",
      headers,
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    return {
      ok: false,
      error:
        "Could not connect to the API URL. Make sure LM Studio Bionic or your server is running, the URL ends in /v1, and CORS is enabled.",
    };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error: `Authentication failed (${response.status}). Check your API Key for this endpoint.`,
      };
    }
    return {
      ok: false,
      error: `API server responded with status ${response.status} (${response.statusText}) when checking ${cleanUrl}/models.`,
    };
  }

  let body: OpenAIModelsResponse;
  try {
    body = (await response.json()) as OpenAIModelsResponse;
  } catch {
    return {
      ok: false,
      error: "Invalid JSON response from /models endpoint. Check your API URL.",
    };
  }

  if (!Array.isArray(body.data)) {
    return {
      ok: false,
      error:
        "Unexpected response format from /models endpoint. Make sure the API URL points to an OpenAI-compatible base URL (ending in /v1).",
    };
  }

  return {
    ok: true,
    models: uniqueSortedOrPreserved(body.data.map((item) => item.id)),
  };
}

async function fetchOllamaModels(
  apiUrl: string,
  signal?: AbortSignal,
): Promise<FetchModelsResult> {
  const cleanUrl = normalizeProviderUrl("ollama", apiUrl);
  if (!cleanUrl || !isValidHttpUrl(cleanUrl)) {
    return {
      ok: false,
      error: "Please enter a valid Ollama URL (e.g. http://localhost:11434).",
    };
  }

  let response: Response;
  try {
    response = await fetch(`${cleanUrl}/api/tags`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    return {
      ok: false,
      error:
        'Could not connect to Ollama. Make sure Ollama is running and CORS allows this origin (e.g. OLLAMA_ORIGINS="*").',
    };
  }

  if (response.ok) {
    try {
      const body = (await response.json()) as OllamaTagsResponse;
      if (Array.isArray(body.models)) {
        return {
          ok: true,
          models: uniqueSortedOrPreserved(
            body.models.map((item) => item.name ?? item.model),
          ),
        };
      }
    } catch {
      return {
        ok: false,
        error: "Invalid JSON response from Ollama /api/tags endpoint.",
      };
    }
  }

  if (response.status !== 404) {
    return {
      ok: false,
      error: `Ollama responded with status ${response.status} (${response.statusText}) at ${cleanUrl}/api/tags.`,
    };
  }

  let fallbackResponse: Response;
  try {
    fallbackResponse = await fetch(`${cleanUrl}/v1/models`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    return {
      ok: false,
      error:
        'Could not connect to Ollama. Make sure Ollama is running and CORS allows this origin (e.g. OLLAMA_ORIGINS="*").',
    };
  }

  if (!fallbackResponse.ok) {
    return {
      ok: false,
      error: `Ollama responded with status ${fallbackResponse.status} (${fallbackResponse.statusText}) at ${cleanUrl}/v1/models.`,
    };
  }

  try {
    const body = (await fallbackResponse.json()) as OpenAIModelsResponse;
    if (!Array.isArray(body.data)) {
      return {
        ok: false,
        error: "Unexpected response format from Ollama /v1/models endpoint.",
      };
    }
    return {
      ok: true,
      models: uniqueSortedOrPreserved(body.data.map((item) => item.id)),
    };
  } catch {
    return {
      ok: false,
      error: "Invalid JSON response from Ollama /v1/models endpoint.",
    };
  }
}

async function fetchGoogleModels(
  apiKey: string,
  signal?: AbortSignal,
): Promise<FetchModelsResult> {
  const cleanApiKey = apiKey.trim();
  if (!cleanApiKey) {
    return {
      ok: false,
      error: "Google Gemini API Key is required.",
    };
  }

  let response: Response;
  try {
    response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?pageSize=100",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-goog-api-key": cleanApiKey,
        },
        signal,
      },
    );
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    return {
      ok: false,
      error:
        "Could not reach Google Gemini API. Check your internet connection or browser network restrictions.",
    };
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error: `Google Gemini rejected the API Key (${response.status}). Verify your key in Google AI Studio.`,
      };
    }
    return {
      ok: false,
      error: `Google Gemini API responded with status ${response.status} (${response.statusText}).`,
    };
  }

  let body: GoogleModelsResponse;
  try {
    body = (await response.json()) as GoogleModelsResponse;
  } catch {
    return {
      ok: false,
      error: "Invalid JSON response from Google Gemini models endpoint.",
    };
  }

  if (!Array.isArray(body.models)) {
    return {
      ok: false,
      error: "Unexpected response format from Google Gemini models endpoint.",
    };
  }

  const models = uniqueSortedOrPreserved(
    body.models
      .filter((item) => {
        if (!Array.isArray(item.supportedGenerationMethods)) {
          return true;
        }
        return item.supportedGenerationMethods.includes("generateContent");
      })
      .map((item) => item.name?.replace(/^models\//i, "")),
  );

  return { ok: true, models };
}

async function fetchAnthropicModels(
  apiKey: string,
  signal?: AbortSignal,
): Promise<FetchModelsResult> {
  const cleanApiKey = apiKey.trim();
  if (!cleanApiKey) {
    return {
      ok: false,
      error: "Claude API Key is required.",
    };
  }

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-key": cleanApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    return {
      ok: false,
      error:
        "Could not reach Anthropic API. Check your internet connection or browser network restrictions.",
    };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error: `Anthropic rejected the API Key (${response.status}). Verify your key in Anthropic Console.`,
      };
    }
    return {
      ok: false,
      error: `Anthropic API responded with status ${response.status} (${response.statusText}).`,
    };
  }

  let body: OpenAIModelsResponse;
  try {
    body = (await response.json()) as OpenAIModelsResponse;
  } catch {
    return {
      ok: false,
      error: "Invalid JSON response from Anthropic models endpoint.",
    };
  }

  if (!Array.isArray(body.data)) {
    return {
      ok: false,
      error: "Unexpected response format from Anthropic models endpoint.",
    };
  }

  return {
    ok: true,
    models: uniqueSortedOrPreserved(body.data.map((item) => item.id)),
  };
}

async function fetchBearerModels(options: {
  apiKey: string;
  modelsUrl: string;
  providerLabel: string;
  keyPortal: string;
  signal?: AbortSignal;
}): Promise<FetchModelsResult> {
  const { apiKey, modelsUrl, providerLabel, keyPortal, signal } = options;
  const cleanApiKey = apiKey.trim();
  if (!cleanApiKey) {
    return {
      ok: false,
      error: `${providerLabel} API Key is required.`,
    };
  }

  let response: Response;
  try {
    response = await fetch(modelsUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${cleanApiKey}`,
      },
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    return {
      ok: false,
      error: `Could not reach ${providerLabel} API. Check your internet connection or browser CORS/network restrictions.`,
    };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error: `${providerLabel} rejected the API Key (${response.status}). Verify your key on ${keyPortal}.`,
      };
    }
    return {
      ok: false,
      error: `${providerLabel} API responded with status ${response.status} (${response.statusText}).`,
    };
  }

  let body: OpenAIModelsResponse;
  try {
    body = (await response.json()) as OpenAIModelsResponse;
  } catch {
    return {
      ok: false,
      error: `Invalid JSON response from ${providerLabel} models endpoint.`,
    };
  }

  if (!Array.isArray(body.data)) {
    return {
      ok: false,
      error: `Unexpected response format from ${providerLabel} models endpoint.`,
    };
  }

  return {
    ok: true,
    models: uniqueSortedOrPreserved(body.data.map((item) => item.id)),
  };
}

export async function fetchAvailableModels(
  provider: AIProvider,
  apiUrl: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<FetchModelsResult> {
  switch (provider) {
    case "openai-compatible":
      return fetchOpenAICompatibleModels(apiUrl, apiKey, signal);
    case "ollama":
      return fetchOllamaModels(apiUrl, signal);
    case "google":
      return fetchGoogleModels(apiKey, signal);
    case "anthropic":
      return fetchAnthropicModels(apiKey, signal);
    case "openai":
      return fetchBearerModels({
        apiKey,
        modelsUrl: "https://api.openai.com/v1/models",
        providerLabel: "OpenAI",
        keyPortal: "OpenAI Platform",
        signal,
      });
    case "openrouter":
      return fetchBearerModels({
        apiKey,
        modelsUrl: "https://openrouter.ai/api/v1/models",
        providerLabel: "OpenRouter",
        keyPortal: "OpenRouter",
        signal,
      });
  }
}

function matchesAvailableModel(
  provider: AIProvider,
  modelId: string,
  availableModels: readonly string[],
): boolean {
  if (availableModels.includes(modelId)) {
    return true;
  }

  if (provider === "ollama" && !modelId.includes(":")) {
    return availableModels.includes(`${modelId}:latest`);
  }

  return false;
}

export async function validateAIConnection(
  input: AIConnectionInput,
  signal?: AbortSignal,
): Promise<
  | { valid: true; models: string[] }
  | { valid: false; error: string; models?: string[] }
> {
  const normalized = normalizeConnectionInput(input);
  const config = AI_PROVIDERS[normalized.provider];

  if (!normalized.name) {
    return {
      valid: false,
      error: "Connection Name is required.",
    };
  }

  if (config.requiresUrl) {
    if (!normalized.apiUrl) {
      return {
        valid: false,
        error: `${config.urlLabel ?? "API URL"} is required.`,
      };
    }
    if (!isValidHttpUrl(normalized.apiUrl)) {
      return {
        valid: false,
        error: `Please enter a valid ${config.urlLabel ?? "API URL"} (e.g. ${config.urlPlaceholder}).`,
      };
    }
  }

  if (config.requiresApiKey && !normalized.apiKey) {
    return {
      valid: false,
      error: `API Key is required for ${config.label}.`,
    };
  }

  if (!normalized.modelId) {
    return {
      valid: false,
      error: "Model ID is required.",
    };
  }

  if (
    config.group === "local" &&
    normalized.tools.webSearch.enabled &&
    !normalized.tools.webSearch.exaApiKey
  ) {
    return {
      valid: false,
      error:
        "Exa API Key is required when Web Search is enabled for local models.",
    };
  }

  const result = await fetchAvailableModels(
    normalized.provider,
    normalized.apiUrl,
    normalized.apiKey,
    signal,
  );
  if (!result.ok) {
    return {
      valid: false,
      error: result.error,
    };
  }

  if (
    !matchesAvailableModel(normalized.provider, normalized.modelId, result.models)
  ) {
    const preview = result.models.slice(0, 8).join(", ");
    const suffix = result.models.length > 8 ? ", ..." : "";
    const availableHint =
      result.models.length > 0
        ? ` Available models: ${preview}${suffix}`
        : ` No models were returned by ${config.label}.`;

    return {
      valid: false,
      error: `Model "${normalized.modelId}" was not found on ${config.label}.${availableHint}`,
      models: result.models,
    };
  }

  return { valid: true, models: result.models };
}
