import { useState } from "react";
import { Settings } from "lucide-react";
import { AgentRunner } from "@/components/AgentRunner";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { Button, Card, CardContent, Flex } from "@/components/ui";
import { useNotifications } from "@/notifications";
import { runSampleAgent } from "@/utils/agent";
import {
  clearAISettings,
  DEFAULT_AI_SETTINGS,
  hasSavedAISettings,
  isAISettingsConfigured,
  loadAISettings,
  normalizeAISettings,
  saveAISettings,
} from "@/utils/settings";
import type { AISettings } from "@/utils/settings";
import styles from "./App.module.css";

export function App() {
  const { notifyError, notifyInfo, notifySuccess } = useNotifications();
  const [settings, setSettings] = useState<AISettings>(() => loadAISettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");

  const configured = isAISettingsConfigured(settings);
  const hasSaved = hasSavedAISettings(settings);

  const handleSaveSettings = (nextSettings: AISettings) => {
    const normalized = normalizeAISettings(nextSettings);
    saveAISettings(normalized);
    setSettings(normalized);
    setIsSettingsOpen(false);
    notifySuccess("AI Settings saved.");
  };

  const handleClearSettings = () => {
    clearAISettings();
    setSettings(DEFAULT_AI_SETTINGS);
    setOutput("");
    setIsSettingsOpen(false);
    notifyInfo("AI Settings cleared.");
  };

  const handleRun = async () => {
    if (!configured || running) {
      return;
    }

    setRunning(true);
    setOutput("");

    try {
      await runSampleAgent(settings, setOutput);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while running the agent.";

      notifyError(message, {
        action: {
          label: "Check Settings",
          onClick: () => setIsSettingsOpen(true),
        },
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Podcast Trust Report</h1>
          <Button
            variant="secondary"
            size="sm"
            disabled={running}
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings aria-hidden="true" size={16} />
            Settings
          </Button>
        </header>

        {configured ? (
          <AgentRunner running={running} output={output} onRun={handleRun} />
        ) : (
          <div className={styles.setupContainer}>
            <Card className={styles.setupCard}>
              <CardContent>
                <Flex direction="column" align="center" gap={4}>
                  <h2 className={styles.setupTitle}>Configure AI Settings</h2>
                  <p className={styles.setupDescription}>
                    Add your API URL and Model ID in Settings to start
                    generating Trust Reports.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    Open Settings
                  </Button>
                </Flex>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <SettingsDrawer
        open={isSettingsOpen}
        settings={settings}
        hasSavedSettings={hasSaved}
        disabled={running}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        onClear={handleClearSettings}
      />
    </>
  );
}

export default App;
