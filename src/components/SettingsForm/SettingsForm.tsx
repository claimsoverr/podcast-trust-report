import { useId } from "react";
import {
  type AISettings,
  API_URL_PLACEHOLDER,
  MODEL_ID_PLACEHOLDER,
} from "@/utils/settings";
import styles from "./SettingsForm.module.css";

interface SettingsFormProps {
  settings: AISettings;
  disabled: boolean;
  onChange: (nextSettings: AISettings) => void;
}

export function SettingsForm({
  settings,
  disabled,
  onChange,
}: SettingsFormProps) {
  const apiUrlId = useId();
  const apiKeyId = useId();
  const modelIdId = useId();

  const updateField = (field: keyof AISettings, value: string) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.legend}>AI Settings</legend>

      <div className={styles.fields}>
        <label className={styles.field} htmlFor={apiUrlId}>
          <span className={styles.label}>API URL</span>
          <input
            id={apiUrlId}
            className={styles.input}
            type="url"
            placeholder={API_URL_PLACEHOLDER}
            value={settings.apiUrl}
            onChange={(e) => updateField("apiUrl", e.target.value)}
          />
        </label>

        <label className={styles.field} htmlFor={modelIdId}>
          <span className={styles.label}>Model ID</span>
          <input
            id={modelIdId}
            className={styles.input}
            type="text"
            placeholder={MODEL_ID_PLACEHOLDER}
            value={settings.modelId}
            onChange={(e) => updateField("modelId", e.target.value)}
          />
        </label>

        <label className={styles.field} htmlFor={apiKeyId}>
          <span className={styles.label}>API Key (optional for local)</span>
          <input
            id={apiKeyId}
            className={styles.input}
            type="password"
            placeholder="sk-..."
            value={settings.apiKey}
            onChange={(e) => updateField("apiKey", e.target.value)}
          />
        </label>
      </div>
    </fieldset>
  );
}
