import { useEffect, useRef, useState } from "react";
import { ExternalLink, Settings } from "lucide-react";
import {
  type EpisodeMetadata,
  extractVideoId,
  runTrustReport,
  type TokenUsage,
} from "@/agent";
import { AgentRunner } from "@/components/AgentRunner";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { Alert, Button, Card, CardContent, Flex } from "@/components/ui";
import { useNotifications } from "@/notifications";
import {
  TRUST_REPORT_UI_PROMPT,
  validateTrustReportOutput,
} from "@/openui";
import {
  type AIGeneralSettings,
  loadAIGeneralSettings,
  resolveEffectiveCorsProxyUrl,
  saveAIGeneralSettings,
} from "@/utils/aiGeneralSettings";
import {
  addConnection,
  type AIConnectionInput,
  type AISettings,
  deleteConnection,
  getActiveConnection,
  getConnectionWebSearchMode,
  loadAISettings,
  saveAISettings,
  setActiveConnection,
  updateConnection,
  validateAIConnection,
} from "@/utils/settings";
import styles from "./App.module.css";

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

export function App() {
  const { notifyError, notifyInfo, notifySuccess } = useNotifications();
  const [settings, setSettings] = useState<AISettings>(() => loadAISettings());
  const [generalSettings, setGeneralSettings] = useState<AIGeneralSettings>(
    () => loadAIGeneralSettings(),
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [episodeUrl, setEpisodeUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [episodeMetadata, setEpisodeMetadata] =
    useState<EpisodeMetadata | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [webSearchCount, setWebSearchCount] = useState<number | null>(null);
  const [generationDurationMs, setGenerationDurationMs] = useState<
    number | null
  >(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const renderErrorRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const activeConnection = getActiveConnection(settings);
  const effectiveProxy = resolveEffectiveCorsProxyUrl(generalSettings);
  const webSearchMode = activeConnection
    ? getConnectionWebSearchMode(activeConnection)
    : "none";

  const commitSettings = (nextSettings: AISettings) => {
    saveAISettings(nextSettings);
    setSettings(nextSettings);
  };

  const handleSaveGeneralSettings = (nextGeneralSettings: AIGeneralSettings) => {
    saveAIGeneralSettings(nextGeneralSettings);
    setGeneralSettings(nextGeneralSettings);
    notifySuccess("AI General settings saved.");
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
      setEpisodeMetadata(null);
      setTokenUsage(null);
      setWebSearchCount(null);
      setGenerationDurationMs(null);
      setStatusMessage(null);
    }
    notifyInfo(
      target
        ? `AI Connection "${target.name}" deleted.`
        : "AI Connection deleted.",
    );
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  const handleRenderError = (message: string) => {
    renderErrorRef.current = message;
    abortControllerRef.current?.abort();
    setStatusMessage(null);
    setRunning(false);
    notifyError(`OpenUI failed to render the Trust Report: ${message}`);
  };

  const handleRun = async () => {
    if (!activeConnection || running) {
      return;
    }

    if (!extractVideoId(episodeUrl)) {
      notifyError(
        "Please enter a valid YouTube Episode URL or 11-character video ID.",
      );
      return;
    }

    if (!effectiveProxy.url) {
      notifyError(
        "A CORS Proxy URL is required to fetch Episode data. Configure it in AI Settings → General.",
        {
          action: {
            label: "Open Settings",
            onClick: () => setIsSettingsOpen(true),
          },
        },
      );
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    renderErrorRef.current = null;

    setRunning(true);
    setOutput("");
    setEpisodeMetadata(null);
    setTokenUsage(null);
    setWebSearchCount(null);
    setGenerationDurationMs(null);
    setStatusMessage("Validating AI Connection...");

    try {
      const validation = await validateAIConnection(
        activeConnection,
        controller.signal,
      );
      if (controller.signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const report = await runTrustReport({
        episodeUrl,
        model: {
          provider: activeConnection.provider,
          apiUrl: activeConnection.apiUrl,
          apiKey: activeConnection.apiKey,
          modelId: activeConnection.modelId,
        },
        tools: {
          corsProxyUrl: effectiveProxy.url,
          webSearch: activeConnection.tools.webSearch,
        },
        uiSystemPrompt: TRUST_REPORT_UI_PROMPT,
        signal: controller.signal,
        onMetadata: setEpisodeMetadata,
        onStatus: (status) => {
          setStatusMessage(status.message);
        },
        onText: setOutput,
        validateUiOutput: validateTrustReportOutput,
      });

      setStatusMessage(null);
      setTokenUsage(report.usage);
      setWebSearchCount(report.webSearchCount);
      setGenerationDurationMs(report.durationMs);
      const uiValidation = validateTrustReportOutput(report.text);
      if (!uiValidation.hasRoot) {
        notifyError(
          uiValidation.errorMessage ??
            "Could not render structured Trust Report. Showing raw output.",
        );
      } else if (!uiValidation.valid) {
        notifyInfo(
          "Trust Report generated with OpenUI validation warnings.",
        );
      } else {
        notifySuccess("Trust Report ready.");
      }
    } catch (err) {
      setStatusMessage(null);

      if (renderErrorRef.current) {
        return;
      }

      if (controller.signal.aborted || isAbortError(err)) {
        notifyInfo("Trust Report generation cancelled.");
        return;
      }

      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while generating the Trust Report.";

      notifyError(message, {
        action: {
          label: "Check Settings",
          onClick: () => setIsSettingsOpen(true),
        },
      });
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
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
              <span
                className={styles.activeConnection}
                title={activeConnection.name}
              >
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

        <div className={styles.content}>
          {!effectiveProxy.url ? (
            <Alert variant="warning">
              <div className={styles.proxyAlertBody}>
                <p className={styles.proxyAlertTitle}>
                  CORS proxy required on hosted builds
                </p>
                <p>
                  This app runs strictly in your browser with no backend server.
                  Browsers block direct requests to YouTube (CORS), so Episode
                  metadata and Transcripts cannot be fetched here without a
                  proxy—and no default proxy is hosted yet.
                </p>
                <ul className={styles.proxyAlertList}>
                  <li>
                    Configure your own CORS Proxy URL in{" "}
                    <strong>AI Settings → General</strong>.
                  </li>
                  <li>
                    Or run the project locally (
                    <code>npm install &amp;&amp; npm run dev</code>), which
                    includes a built-in dev proxy.
                  </li>
                </ul>
                <div className={styles.proxyAlertActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={running}
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    Configure proxy
                  </Button>
                  <a
                    href="https://github.com/claimsoverr/podcast-trust-report"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.repoLink}
                  >
                    Run locally on GitHub
                    <ExternalLink aria-hidden="true" size={14} />
                  </a>
                </div>
              </div>
            </Alert>
          ) : null}

          {activeConnection ? (
            <AgentRunner
              episodeUrl={episodeUrl}
              onEpisodeUrlChange={setEpisodeUrl}
              running={running}
              statusMessage={statusMessage}
              output={output}
              episodeMetadata={episodeMetadata}
              tokenUsage={tokenUsage}
              webSearchMode={webSearchMode}
              webSearchCount={webSearchCount}
              generationDurationMs={generationDurationMs}
              missingProxyInProd={!effectiveProxy.url}
              onRun={handleRun}
              onCancel={handleCancel}
              onRenderError={handleRenderError}
            />
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
        </div>
      </main>

      <SettingsDrawer
        open={isSettingsOpen}
        settings={settings}
        generalSettings={generalSettings}
        disabled={running}
        onClose={() => setIsSettingsOpen(false)}
        onSelectActive={handleSelectActive}
        onAddConnection={handleAddConnection}
        onUpdateConnection={handleUpdateConnection}
        onDeleteConnection={handleDeleteConnection}
        onSaveGeneralSettings={handleSaveGeneralSettings}
      />
    </>
  );
}

export default App;
