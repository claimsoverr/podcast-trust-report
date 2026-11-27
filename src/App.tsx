import { useState } from "react";
import { Settings } from "lucide-react";
import { AgentRunner } from "@/components/AgentRunner";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { Button, Card, CardContent, Flex } from "@/components/ui";
import { useNotifications } from "@/notifications";
import { runSampleAgent } from "@/utils/agent";
import {
  addConnection,
  type AIConnectionInput,
  type AISettings,
  deleteConnection,
  getActiveConnection,
  loadAISettings,
  saveAISettings,
  setActiveConnection,
  updateConnection,
} from "@/utils/settings";
import styles from "./App.module.css";

export function App() {
  const { notifyError, notifyInfo, notifySuccess } = useNotifications();
  const [settings, setSettings] = useState<AISettings>(() => loadAISettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");

  const activeConnection = getActiveConnection(settings);

  const commitSettings = (nextSettings: AISettings) => {
    saveAISettings(nextSettings);
    setSettings(nextSettings);
  };

  const handleSelectActive = (id: string) => {
    if (id === settings.activeConnectionId) {
      return;
    }
    const nextSettings = setActiveConnection(settings, id);
    commitSettings(nextSettings);
    const chosen = getActiveConnection(nextSettings);
    if (chosen) {
      notifyInfo(`Switched active AI Connection to "${chosen.name}".`);
    }
  };

  const handleAddConnection = (input: AIConnectionInput) => {
    const nextSettings = addConnection(settings, input);
    commitSettings(nextSettings);
    notifySuccess(`AI Connection "${input.name}" added and set as active.`);
  };

  const handleUpdateConnection = (id: string, input: AIConnectionInput) => {
    const nextSettings = updateConnection(settings, id, input);
    commitSettings(nextSettings);
    notifySuccess(`AI Connection "${input.name}" updated.`);
  };

  const handleDeleteConnection = (id: string) => {
    const target = settings.connections.find((conn) => conn.id === id);
    const nextSettings = deleteConnection(settings, id);
    commitSettings(nextSettings);
    if (nextSettings.connections.length === 0) {
      setOutput("");
    }
    notifyInfo(
      target
        ? `AI Connection "${target.name}" deleted.`
        : "AI Connection deleted.",
    );
  };

  const handleRun = async () => {
    if (!activeConnection || running) {
      return;
    }

    setRunning(true);
    setOutput("");

    try {
      await runSampleAgent(activeConnection, setOutput);
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
          <div className={styles.headerActions}>
            {activeConnection ? (
              <span className={styles.activeConnection} title={activeConnection.name}>
                {activeConnection.name}
              </span>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              disabled={running}
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings aria-hidden="true" size={16} />
              Settings
            </Button>
          </div>
        </header>

        {activeConnection ? (
          <AgentRunner running={running} output={output} onRun={handleRun} />
        ) : (
          <div className={styles.setupContainer}>
            <Card className={styles.setupCard}>
              <CardContent>
                <Flex direction="column" align="center" gap={4}>
                  <h2 className={styles.setupTitle}>Configure AI Settings</h2>
                  <p className={styles.setupDescription}>
                    Add an AI Connection in Settings to start generating Trust
                    Reports.
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
        disabled={running}
        onClose={() => setIsSettingsOpen(false)}
        onSelectActive={handleSelectActive}
        onAddConnection={handleAddConnection}
        onUpdateConnection={handleUpdateConnection}
        onDeleteConnection={handleDeleteConnection}
      />
    </>
  );
}

export default App;
