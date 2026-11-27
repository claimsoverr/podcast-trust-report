export interface AIGeneralSettings {
  corsProxyUrl: string;
}

const STORAGE_KEY = "podcast-trust-report:ai-general-settings";

export const DEFAULT_AI_GENERAL_SETTINGS: AIGeneralSettings = {
  corsProxyUrl: "",
};

export function normalizeGeneralSettings(
  input: AIGeneralSettings,
): AIGeneralSettings {
  return {
    corsProxyUrl: input.corsProxyUrl.trim(),
  };
}

export function validateCorsProxyUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const probe = trimmed.includes("{url}")
    ? trimmed.replaceAll("{url}", encodeURIComponent("https://example.com"))
    : trimmed;

  try {
    const parsed = new URL(probe);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "CORS Proxy URL must start with http:// or https://.";
    }
    return null;
  } catch {
    return "Please enter a valid CORS Proxy URL (e.g. https://proxy.example.com/?url={url}).";
  }
}

export function loadAIGeneralSettings(): AIGeneralSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_AI_GENERAL_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AIGeneralSettings>;
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_AI_GENERAL_SETTINGS;
    }

    return normalizeGeneralSettings({
      corsProxyUrl:
        typeof parsed.corsProxyUrl === "string" ? parsed.corsProxyUrl : "",
    });
  } catch {
    return DEFAULT_AI_GENERAL_SETTINGS;
  }
}

export function saveAIGeneralSettings(settings: AIGeneralSettings): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizeGeneralSettings(settings)),
  );
}

export function resolveEffectiveCorsProxyUrl(settings: AIGeneralSettings): {
  url: string;
  usingDevProxy: boolean;
} {
  const configured = settings.corsProxyUrl.trim();
  if (configured) {
    return { url: configured, usingDevProxy: false };
  }

  if (import.meta.env.DEV) {
    return {
      url: `${import.meta.env.BASE_URL}cors-proxy?url=`,
      usingDevProxy: true,
    };
  }

  return { url: "", usingDevProxy: false };
}
