import { useState } from "react";
import { AgentRunner } from "@/components/AgentRunner";
import { SettingsForm } from "@/components/SettingsForm";
import { runSampleAgent } from "@/utils/agent";
import {
  type AISettings,
  isAISettingsConfigured,
  loadAISettings,
  saveAISettings,
} from "@/utils/settings";
import styles from "./App.module.css";

export function App() {
  const [settings, setSettings] = useState<AISettings>(() => loadAISettings());
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const configured = isAISettingsConfigured(settings);

  const handleSettingsChange = (nextSettings: AISettings) => {
    setSettings(nextSettings);
    saveAISettings(nextSettings);
    setError(null);
  };

  const handleRun = async () => {
    if (!configured || running) {
      return;
    }

    setRunning(true);
    setOutput("");
    setError(null);

    try {
      await runSampleAgent(settings, setOutput);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while running the agent.",
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Podcast Trust Report</h1>
      </header>

      <SettingsForm
        settings={settings}
        disabled={running}
        onChange={handleSettingsChange}
      />

      <AgentRunner
        configured={configured}
        running={running}
        output={output}
        error={error}
        onRun={handleRun}
      />
    </main>
  );
}

export default App;
