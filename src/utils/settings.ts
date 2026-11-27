export type AIProvider = "openai-compatible" | "google";

export interface AISettings {
  provider: AIProvider;
  apiUrl: string;
  apiKey: string;
  modelId: string;
}

const STORAGE_KEY = "podcast-trust-report:ai-settings";

export const API_URL_PLACEHOLDER = "http://localhost:1235/v1";
export const MODEL_ID_PLACEHOLDER = "google/gemma-4-e2b";

export const SUGGESTED_API_URLS = [
  "http://localhost:1234/v1",
  "http://localhost:1235/v1",
] as const;

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: "openai-compatible",
  apiUrl: "",
  apiKey: "",
  modelId: "",
};

export function normalizeAISettings(settings: AISettings): AISettings {
  return {
    provider:
      settings.provider === "google" ? "google" : "openai-compatible",
    apiUrl: settings.apiUrl.trim().replace(/\/+$/, ""),
    apiKey: settings.apiKey.trim(),
    modelId: settings.modelId.trim(),
  };
}

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_AI_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AISettings>;
    return {
      provider:
        parsed.provider === "google" ? "google" : "openai-compatible",
      apiUrl: typeof parsed.apiUrl === "string" ? parsed.apiUrl : "",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      modelId: typeof parsed.modelId === "string" ? parsed.modelId : "",
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: AISettings): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizeAISettings(settings)),
  );
}

export function clearAISettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSavedAISettings(settings: AISettings): boolean {
  return Boolean(
    settings.apiUrl.trim() || settings.modelId.trim() || settings.apiKey.trim(),
  );
}

export function isAISettingsConfigured(settings: AISettings): boolean {
  return Boolean(settings.apiUrl.trim() && settings.modelId.trim());
}

interface ModelsResponse {
  data?: Array<{
    id?: string;
  }>;
}

export async function fetchAvailableModels(
  apiUrl: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<{ ok: true; models: string[] } | { ok: false; error: string }> {
  const cleanUrl = apiUrl.trim().replace(/\/+$/, "");
  const cleanApiKey = apiKey.trim();

  if (!cleanUrl) {
    return {
      ok: false,
      error: "API URL is required.",
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
        "Could not connect to the API URL. Make sure the server is running, the URL is correct (e.g. http://localhost:1235/v1), and CORS is enabled.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `API server responded with status ${response.status} (${response.statusText}) when checking ${cleanUrl}/models.`,
    };
  }

  let body: ModelsResponse;
  try {
    body = (await response.json()) as ModelsResponse;
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

  const models = Array.from(
    new Set(
      body.data
        .map((item) => item.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  return { ok: true, models };
}

export async function validateAISettings(
  settings: AISettings,
  signal?: AbortSignal,
): Promise<
  { valid: true; models: string[] } | { valid: false; error: string; models?: string[] }
> {
  const {
    apiUrl: cleanUrl,
    modelId: cleanModelId,
    apiKey: cleanApiKey,
  } = normalizeAISettings(settings);

  if (!cleanUrl || !cleanModelId) {
    return {
      valid: false,
      error: "Both API URL and Model ID are required.",
    };
  }

  const result = await fetchAvailableModels(cleanUrl, cleanApiKey, signal);
  if (!result.ok) {
    return {
      valid: false,
      error: result.error,
    };
  }

  if (!result.models.includes(cleanModelId)) {
    const availableHint =
      result.models.length > 0
        ? ` Available models: ${result.models.join(", ")}`
        : " No models are currently loaded on the server.";

    return {
      valid: false,
      error: `Model "${cleanModelId}" was not found on the server.${availableHint}`,
      models: result.models,
    };
  }

  return { valid: true, models: result.models };
}
