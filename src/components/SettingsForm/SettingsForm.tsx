import { type SubmitEvent, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { Button, Fieldset, Input, Select } from "@/components/ui";
import { useNotifications } from "@/notifications";
import {
  AI_PROVIDER_GROUPS,
  AI_PROVIDERS,
  type AIProvider,
  DEFAULT_PROVIDER,
  isValidAIProvider,
} from "@/utils/providers";
import {
  type AIConnection,
  type AIConnectionInput,
  createDefaultConnectionTools,
  fetchAvailableModels,
  isValidHttpUrl,
  normalizeConnectionInput,
  validateAIConnection,
} from "@/utils/settings";
import styles from "./SettingsForm.module.css";

interface SettingsFormProps {
  initialConnection?: AIConnection;
  disabled?: boolean;
  onSave: (input: AIConnectionInput) => void;
  onCancel: () => void;
}

function getModelRequestKey(
  provider: AIProvider,
  apiUrl: string,
  apiKey: string,
): string {
  const config = AI_PROVIDERS[provider];
  if (config.requiresUrl) {
    const trimmedUrl = apiUrl.trim().replace(/\/+$/, "");
    if (!trimmedUrl || !isValidHttpUrl(trimmedUrl)) {
      return "";
    }
    return `${provider}\0${trimmedUrl}\0${apiKey.trim()}`;
  }

  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return "";
  }
  return `${provider}\0${trimmedKey}`;
}

export function SettingsForm({
  initialConnection,
  disabled = false,
  onSave,
  onCancel,
}: SettingsFormProps) {
  const { notifyError } = useNotifications();
  const initialProvider = initialConnection?.provider ?? DEFAULT_PROVIDER;
  const initialTools =
    initialConnection?.tools ?? createDefaultConnectionTools(initialProvider);

  const [name, setName] = useState(initialConnection?.name ?? "");
  const [provider, setProvider] = useState<AIProvider>(initialProvider);
  const [apiUrl, setApiUrl] = useState(
    initialConnection
      ? initialConnection.apiUrl
      : AI_PROVIDERS[initialProvider].defaultUrl,
  );
  const [apiKey, setApiKey] = useState(initialConnection?.apiKey ?? "");
  const [modelId, setModelId] = useState(initialConnection?.modelId ?? "");
  const [webSearchEnabled, setWebSearchEnabled] = useState(
    initialTools.webSearch.enabled,
  );
  const [exaApiKey, setExaApiKey] = useState(initialTools.webSearch.exaApiKey);
  const [modelCatalog, setModelCatalog] = useState<{
    requestKey: string;
    models: string[];
  }>({ requestKey: "", models: [] });
  const [fetchingToken, setFetchingToken] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [saving, setSaving] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const modelListId = useId();

  const providerConfig = AI_PROVIDERS[provider];
  const requestKey = getModelRequestKey(provider, apiUrl, apiKey);
  const activeFetchToken = requestKey ? `${requestKey}\0${refreshNonce}` : "";
  const fetchingModels =
    Boolean(activeFetchToken) && fetchingToken === activeFetchToken;
  const availableModels =
    modelCatalog.requestKey === requestKey ? modelCatalog.models : [];

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!requestKey) {
      return;
    }

    const controller = new AbortController();
    const delay = refreshNonce > 0 ? 0 : 300;

    const timerId = window.setTimeout(async () => {
      setFetchingToken(activeFetchToken);
      try {
        const result = await fetchAvailableModels(
          provider,
          apiUrl,
          apiKey,
          controller.signal,
        );
        if (controller.signal.aborted) {
          return;
        }
        setModelCatalog({
          requestKey,
          models: result.ok ? result.models : [],
        });
      } catch {
        if (!controller.signal.aborted) {
          setModelCatalog({ requestKey, models: [] });
        }
      } finally {
        if (!controller.signal.aborted) {
          setFetchingToken(null);
        }
      }
    }, delay);

    return () => {
      window.clearTimeout(timerId);
      controller.abort();
    };
  }, [requestKey, activeFetchToken, provider, apiUrl, apiKey, refreshNonce]);

  const handleProviderChange = (nextValue: string) => {
    if (!isValidAIProvider(nextValue)) {
      return;
    }

    const nextConfig = AI_PROVIDERS[nextValue];
    const nextTools = createDefaultConnectionTools(nextValue);
    setProvider(nextValue);
    setApiUrl(nextConfig.defaultUrl);
    setApiKey("");
    setModelId("");
    setWebSearchEnabled(nextTools.webSearch.enabled);
    setExaApiKey(nextTools.webSearch.exaApiKey);
    setModelCatalog({ requestKey: "", models: [] });
    setRefreshNonce(0);
  };

  const handleRefreshModels = () => {
    if (!requestKey) {
      if (providerConfig.requiresUrl) {
        notifyError(
          `Enter a valid ${providerConfig.urlLabel ?? "API URL"} before loading models.`,
        );
      } else {
        notifyError(
          `Enter your ${providerConfig.label} API Key before loading models.`,
        );
      }
      return;
    }

    setRefreshNonce((prev) => prev + 1);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || saving) {
      return;
    }

    const normalized = normalizeConnectionInput({
      name,
      provider,
      apiUrl,
      apiKey,
      modelId,
      tools: {
        webSearch: {
          enabled: webSearchEnabled,
          exaApiKey,
        },
      },
    });

    if (!normalized.name) {
      notifyError("Connection Name is required.");
      return;
    }

    if (providerConfig.requiresUrl) {
      if (!normalized.apiUrl) {
        notifyError(`${providerConfig.urlLabel ?? "API URL"} is required.`);
        return;
      }
      if (!isValidHttpUrl(normalized.apiUrl)) {
        notifyError(
          `Please enter a valid ${providerConfig.urlLabel ?? "API URL"} (e.g. ${providerConfig.urlPlaceholder}).`,
        );
        return;
      }
    }

    if (providerConfig.requiresApiKey && !normalized.apiKey) {
      notifyError(`API Key is required for ${providerConfig.label}.`);
      return;
    }

    if (!normalized.modelId) {
      notifyError("Model ID is required.");
      return;
    }

    if (
      providerConfig.group === "local" &&
      normalized.tools.webSearch.enabled &&
      !normalized.tools.webSearch.exaApiKey
    ) {
      notifyError(
        "Exa API Key is required when Web Search is enabled for local models.",
      );
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setSaving(true);

    try {
      const validation = await validateAIConnection(
        normalized,
        controller.signal,
      );
      if (controller.signal.aborted) {
        return;
      }

      if (validation.valid) {
        setModelCatalog({ requestKey, models: validation.models });
        onSave(normalized);
      } else {
        if (validation.models) {
          setModelCatalog({ requestKey, models: validation.models });
        }
        notifyError(validation.error);
      }
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      notifyError(
        err instanceof Error
          ? err.message
          : "Could not verify AI Connection.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setSaving(false);
      }
    }
  };

  const isFormDisabled = disabled || saving;
  const cleanUrlForPresetMatch = apiUrl.trim().replace(/\/+$/, "");

  const recommendedIds = new Set(
    providerConfig.recommendedModels?.map((item) => item.id) ?? [],
  );
  const discoveredSuggestions = availableModels
    .filter((id) => !recommendedIds.has(id))
    .slice(0, 6);

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isFormDisabled}
          onClick={onCancel}
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to connections
        </Button>
      </div>

      <Fieldset disabled={isFormDisabled}>
        <legend className="visually-hidden">
          {initialConnection ? "Edit AI Connection" : "Add AI Connection"}
        </legend>

        <div className={styles.fields}>
          <Input
            label="Connection Name"
            type="text"
            required
            autoFocus
            placeholder={providerConfig.namePlaceholder}
            hint="A label to identify this connection in your list."
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <Select
            label="AI Provider"
            groups={AI_PROVIDER_GROUPS}
            value={provider}
            onChange={(event) => handleProviderChange(event.target.value)}
          />

          <div className={styles.providerBanner}>
            <p className={styles.bannerSummary}>{providerConfig.summary}</p>
            <div className={styles.bannerLinks}>
              <a
                href={providerConfig.primaryLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                {providerConfig.primaryLink.label}
                <ExternalLink aria-hidden="true" size={13} />
              </a>
              {providerConfig.secondaryLink ? (
                <a
                  href={providerConfig.secondaryLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  {providerConfig.secondaryLink.label}
                  <ExternalLink aria-hidden="true" size={13} />
                </a>
              ) : null}
            </div>
            {providerConfig.privacyNote ? (
              <p className={styles.privacyNote}>{providerConfig.privacyNote}</p>
            ) : null}
          </div>

          <details className={styles.guide}>
            <summary className={styles.guideSummary}>
              Setup &amp; troubleshooting
            </summary>
            <ol className={styles.guideList}>
              {providerConfig.setupSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </details>

          {providerConfig.requiresUrl ? (
            <div className={styles.fieldGroup}>
              <Input
                label={providerConfig.urlLabel ?? "API URL"}
                type="url"
                required
                placeholder={providerConfig.urlPlaceholder}
                hint={
                  provider === "openai-compatible" ? (
                    <>
                      Base URL ending in <code>/v1</code> (recommended:{" "}
                      <code>http://localhost:1235/v1</code> for LM Studio
                      Bionic).
                    </>
                  ) : (
                    <>
                      Base Ollama server URL (default:{" "}
                      <code>http://localhost:11434</code>).
                    </>
                  )
                }
                value={apiUrl}
                onChange={(event) => setApiUrl(event.target.value)}
              />

              {providerConfig.urlPresets?.length ? (
                <div
                  className={styles.chipRow}
                  role="group"
                  aria-label="Quick-fill server URLs"
                >
                  {providerConfig.urlPresets.map((preset) => {
                    const isSelected = cleanUrlForPresetMatch === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        className={styles.chip}
                        data-selected={isSelected || undefined}
                        onClick={() => setApiUrl(preset.url)}
                      >
                        <span>{preset.label}</span>
                        <code className={styles.chipCode}>{preset.url}</code>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {providerConfig.supportsApiKey ? (
            <Input
              label={
                providerConfig.requiresApiKey
                  ? "API Key"
                  : "API Key (optional for local)"
              }
              type="password"
              required={providerConfig.requiresApiKey}
              autoComplete="off"
              placeholder={providerConfig.apiKeyPlaceholder}
              hint={
                providerConfig.requiresApiKey ? (
                  <>
                    Stored only in this browser.{" "}
                    <a
                      href={providerConfig.primaryLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Generate an API key
                    </a>
                    .
                  </>
                ) : (
                  "Leave blank for LM Studio Bionic or other local servers."
                )
              }
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          ) : null}

          <div className={styles.fieldGroup}>
            <div className={styles.modelRow}>
              <Input
                label="Model ID"
                type="text"
                required
                list={modelListId}
                placeholder={providerConfig.modelPlaceholder}
                hint="Pick a suggestion below or enter any supported model ID."
                className={styles.modelInput}
                value={modelId}
                onChange={(event) => setModelId(event.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={fetchingModels}
                disabled={isFormDisabled}
                className={styles.refreshButton}
                aria-label="Refresh available models"
                onClick={handleRefreshModels}
              >
                {fetchingModels ? null : (
                  <RefreshCw aria-hidden="true" size={14} />
                )}
                Refresh
              </Button>
            </div>
            <datalist id={modelListId}>
              {availableModels.map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>

            {providerConfig.recommendedModels?.length ? (
              <div
                className={styles.chipRow}
                role="group"
                aria-label="Recommended models"
              >
                {providerConfig.recommendedModels.map((model) => {
                  const isSelected = modelId.trim() === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      className={styles.chip}
                      data-selected={isSelected || undefined}
                      onClick={() => setModelId(model.id)}
                    >
                      <span>{model.label}</span>
                      <code className={styles.chipCode}>{model.id}</code>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {discoveredSuggestions.length > 0 ? (
              <div
                className={styles.chipRow}
                role="group"
                aria-label="Available models from server"
              >
                {discoveredSuggestions.map((id) => {
                  const isSelected = modelId.trim() === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={styles.chip}
                      data-selected={isSelected || undefined}
                      onClick={() => setModelId(id)}
                    >
                      <code className={styles.chipCode}>{id}</code>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <section className={styles.toolsSection} aria-label="Connection tools">
            <h3 className={styles.toolsHeading}>Tools</h3>
            <ul className={styles.toolsList}>
              <li className={styles.toolItem}>
                <label className={styles.toolToggle}>
                  <input
                    type="checkbox"
                    className={styles.toolCheckbox}
                    checked={webSearchEnabled}
                    onChange={(event) =>
                      setWebSearchEnabled(event.target.checked)
                    }
                  />
                  <span className={styles.toolMeta}>
                    <span className={styles.toolName}>Web Search</span>
                    <span className={styles.toolDescription}>
                      {providerConfig.group === "cloud"
                        ? `Uses ${providerConfig.label}'s built-in web search (no extra key required).`
                        : "Optional. Uses Exa to fact-check Claims and research Guests."}
                    </span>
                  </span>
                </label>

                {providerConfig.group === "local" && webSearchEnabled ? (
                  <Input
                    label="Exa API Key"
                    type="password"
                    required
                    autoComplete="off"
                    placeholder="exa-..."
                    hint={
                      <>
                        Stored only in this browser.{" "}
                        <a
                          href="https://dashboard.exa.ai/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.externalLink}
                        >
                          Get an Exa key
                          <ExternalLink aria-hidden="true" size={12} />
                        </a>
                      </>
                    }
                    value={exaApiKey}
                    onChange={(event) => setExaApiKey(event.target.value)}
                  />
                ) : null}
              </li>
            </ul>
          </section>
        </div>
      </Fieldset>

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={saving}
          disabled={disabled}
        >
          {saving ? "Verifying..." : "Save connection"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={isFormDisabled}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
