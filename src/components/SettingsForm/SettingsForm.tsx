import { Card, CardContent, Fieldset, Input } from "@/components/ui";
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
  const updateField = (field: keyof AISettings, value: string) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardContent>
        <Fieldset disabled={disabled}>
          <legend className={styles.legend}>AI Settings</legend>

          <div className={styles.fields}>
            <Input
              label="API URL"
              type="url"
              placeholder={API_URL_PLACEHOLDER}
              value={settings.apiUrl}
              onChange={(e) => updateField("apiUrl", e.target.value)}
            />

            <Input
              label="Model ID"
              type="text"
              placeholder={MODEL_ID_PLACEHOLDER}
              value={settings.modelId}
              onChange={(e) => updateField("modelId", e.target.value)}
            />

            <Input
              label="API Key (optional for local)"
              type="password"
              placeholder="sk-..."
              value={settings.apiKey}
              onChange={(e) => updateField("apiKey", e.target.value)}
            />
          </div>
        </Fieldset>
      </CardContent>
    </Card>
  );
}
