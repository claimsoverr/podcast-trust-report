import { type SubmitEvent, useState } from "react";
import { Button, Fieldset, Input } from "@/components/ui";
import { useNotifications } from "@/notifications";
import {
  type AIGeneralSettings,
  DEFAULT_AI_GENERAL_SETTINGS,
  normalizeGeneralSettings,
  validateCorsProxyUrl,
} from "@/utils/aiGeneralSettings";
import styles from "./GeneralSettingsForm.module.css";

interface GeneralSettingsFormProps {
  settings: AIGeneralSettings;
  disabled?: boolean;
  onSave: (nextSettings: AIGeneralSettings) => void;
}

export function GeneralSettingsForm({
  settings,
  disabled = false,
  onSave,
}: GeneralSettingsFormProps) {
  const { notifyError } = useNotifications();
  const [corsProxyUrl, setCorsProxyUrl] = useState(settings.corsProxyUrl);

  const normalizedDraft = normalizeGeneralSettings({ corsProxyUrl });
  const isDirty = normalizedDraft.corsProxyUrl !== settings.corsProxyUrl;
  const isEmpty = normalizedDraft.corsProxyUrl === "";

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) {
      return;
    }

    const proxyError = validateCorsProxyUrl(normalizedDraft.corsProxyUrl);
    if (proxyError) {
      notifyError(proxyError);
      return;
    }

    onSave(normalizedDraft);
  };

  const handleReset = () => {
    if (disabled) {
      return;
    }
    setCorsProxyUrl(DEFAULT_AI_GENERAL_SETTINGS.corsProxyUrl);
    onSave(DEFAULT_AI_GENERAL_SETTINGS);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <Fieldset disabled={disabled}>
        <legend className="visually-hidden">AI General Settings</legend>

        <Input
          label="CORS Proxy URL"
          type="url"
          placeholder="https://your-proxy.example.com/?url={url}"
          hint={
            import.meta.env.DEV ? (
              <>
                Required by browsers to fetch Episode captions and web search
                results. Leave blank in local dev to use the built-in{" "}
                <code>/cors-proxy</code> middleware, or provide a{" "}
                <code>{"{url}"}</code> template or <code>?url=</code> prefix.
              </>
            ) : (
              <>
                Required in static production builds to fetch Episode captions
                and web search results from the browser. Supports{" "}
                <code>{"{url}"}</code> placeholder or <code>?url=</code> prefix.
              </>
            )
          }
          value={corsProxyUrl}
          onChange={(event) => setCorsProxyUrl(event.target.value)}
        />
      </Fieldset>

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={disabled || !isDirty}
        >
          Save general settings
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || isEmpty}
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
