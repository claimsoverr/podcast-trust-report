import { type SubmitEvent, useEffect, useId, useRef, useState } from "react";
import {
  Button,
  Fieldset,
  Input,
  Select,
  type SelectOption,
} from "@/components/ui";
import { useNotifications } from "@/notifications";
import {
  type AIProvider,
  type AISettings,
  API_URL_PLACEHOLDER,
  fetchAvailableModels,
  MODEL_ID_PLACEHOLDER,
  normalizeAISettings,
  SUGGESTED_API_URLS,
  validateAISettings,
} from "@/utils/settings";
import styles from "./SettingsForm.module.css";

const PROVIDER_OPTIONS: readonly SelectOption[] = [
  { value: "openai-compatible", label: "OpenAI-compatible" },
  { value: "google", label: "Google", disabled: true },
];

interface SettingsFormProps {
  settings: AISettings;
  hasSavedSettings: boolean;
  disabled?: boolean;
  onSave: (nextSettings: AISettings) => void;
  onClear: () => void;
}

function getModelRequestKey(apiUrl: string, apiKey: string): string {
  const trimmedUrl = apiUrl.trim().replace(/\/+$/, "");
  if (!trimmedUrl) {
    return "";
  }

  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return `${trimmedUrl}\0${apiKey.trim()}`;
  } catch {
    return "";
  }
}

export function SettingsForm({
  settings,
  hasSavedSettings,
  disabled = false,
  onSave,
  onClear,
}: SettingsFormProps) {
  const { notifyError, notifySuccess } = useNotifications();
  const [provider, setProvider] = useState<AIProvider>(settings.provider);
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [modelId, setModelId] = useState(settings.modelId);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [modelCatalog, setModelCatalog] = useState<{
    requestKey: string;
    models: string[];
  }>({ requestKey: "", models: [] });
  const [testing, setTesting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const apiUrlListId = useId();
  const modelListId = useId();

  const requestKey = getModelRequestKey(apiUrl, apiKey);
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
    const timerId = window.setTimeout(async () => {
      try {
        const result = await fetchAvailableModels(
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
      }
    }, 300);

    return () => {
      window.clearTimeout(timerId);
      controller.abort();
    };
  }, [requestKey, apiUrl, apiKey]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || testing) {
      return;
    }

    const normalized = normalizeAISettings({
      provider,
      apiUrl,
      modelId,
      apiKey,
    });
    if (!normalized.apiUrl || !normalized.modelId) {
      notifyError("Both API URL and Model ID are required.");
      return;
    }

    try {
      new URL(normalized.apiUrl);
    } catch {
      notifyError(
        "Please enter a valid API URL (e.g. http://localhost:1235/v1).",
      );
      return;
    }

    onSave(normalized);
  };

  const handleTestConnection = async () => {
    if (disabled || testing) {
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setTesting(true);

    try {
      const validation = await validateAISettings(
        { provider, apiUrl, modelId, apiKey },
        controller.signal,
      );
      if (controller.signal.aborted) {
        return;
      }

      if (validation.valid) {
        setModelCatalog({ requestKey, models: validation.models });
        notifySuccess("Connection verified. Model is available.");
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
          : "Could not verify AI connection.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setTesting(false);
      }
    }
  };

  const isFormDisabled = disabled || testing;

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <Fieldset disabled={isFormDisabled}>
        <legend className="visually-hidden">AI Settings</legend>

        <div className={styles.fields}>
          <Select
            label="AI Provider"
            options={PROVIDER_OPTIONS}
            value={provider}
            hint="Google is not supported yet."
            onChange={(event) => setProvider(event.target.value as AIProvider)}
          />

          <Input
            label="API URL"
            type="url"
            autoFocus
            list={apiUrlListId}
            placeholder={API_URL_PLACEHOLDER}
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
          />
          <datalist id={apiUrlListId}>
            {SUGGESTED_API_URLS.map((url) => (
              <option key={url} value={url} />
            ))}
          </datalist>

          <Input
            label="API Key (optional for local)"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />

          <Input
            label="Model ID"
            type="text"
            list={modelListId}
            placeholder={MODEL_ID_PLACEHOLDER}
            value={modelId}
            onChange={(event) => setModelId(event.target.value)}
          />
          <datalist id={modelListId}>
            {availableModels.map((id) => (
              <option key={id} value={id} />
            ))}
          </datalist>
        </div>
      </Fieldset>

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isFormDisabled}
        >
          Save
        </Button>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          isLoading={testing}
          disabled={disabled}
          onClick={handleTestConnection}
        >
          {testing ? "Testing connection..." : "Test connection"}
        </Button>
      </div>

      {hasSavedSettings ? (
        <div className={styles.clearSection}>
          <Button
            type="button"
            variant="danger"
            fullWidth
            disabled={isFormDisabled}
            onClick={onClear}
          >
            Clear settings
          </Button>
        </div>
      ) : null}
    </form>
  );
}
