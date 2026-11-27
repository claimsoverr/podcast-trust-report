import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useNotifications } from "@/notifications";
import { AI_PROVIDERS } from "@/utils/providers";
import { type AIConnection, validateAIConnection } from "@/utils/settings";
import styles from "./ConnectionList.module.css";

interface ConnectionListProps {
  connections: readonly AIConnection[];
  activeConnectionId: string | null;
  disabled?: boolean;
  onSelectActive: (id: string) => void;
  onAdd: () => void;
  onEdit: (connection: AIConnection) => void;
  onDelete: (id: string) => void;
}

interface TestStatus {
  id: string;
  ok: boolean;
  label: string;
}

export function ConnectionList({
  connections,
  activeConnectionId,
  disabled = false,
  onSelectActive,
  onAdd,
  onEdit,
  onDelete,
}: ConnectionListProps) {
  const { notifyError, notifySuccess } = useNotifications();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleTest = async (connection: AIConnection) => {
    if (disabled || testingId !== null) {
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setTestingId(connection.id);
    setConfirmDeleteId(null);

    try {
      const validation = await validateAIConnection(
        connection,
        controller.signal,
      );
      if (controller.signal.aborted) {
        return;
      }

      if (validation.valid) {
        setTestStatus({
          id: connection.id,
          ok: true,
          label: "Verified",
        });
        notifySuccess(`"${connection.name}" verified. Model is available.`);
      } else {
        setTestStatus({
          id: connection.id,
          ok: false,
          label: "Failed",
        });
        notifyError(validation.error);
      }
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      setTestStatus({
        id: connection.id,
        ok: false,
        label: "Failed",
      });
      notifyError(
        err instanceof Error
          ? err.message
          : `Could not verify "${connection.name}".`,
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setTestingId(null);
      }
    }
  };

  if (connections.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>No AI Connections yet</h2>
        <p className={styles.emptyDescription}>
          Add a connection using a local model (like LM Studio Bionic or Ollama)
          or your own API key for Google Gemini, Claude, or OpenAI.
        </p>
        <Button
          type="button"
          variant="primary"
          fullWidth
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus aria-hidden="true" size={16} />
          Add connection
        </Button>
      </div>
    );
  }

  const isBusy = disabled || testingId !== null;

  return (
    <div className={styles.container}>
      <div className={styles.topActions}>
        <Button
          type="button"
          variant="primary"
          fullWidth
          disabled={isBusy}
          onClick={() => {
            setConfirmDeleteId(null);
            onAdd();
          }}
        >
          <Plus aria-hidden="true" size={16} />
          Add connection
        </Button>
      </div>

      <ul className={styles.list} aria-label="Saved AI Connections">
        {connections.map((connection) => {
          const isActive = connection.id === activeConnectionId;
          const isTestingThis = testingId === connection.id;
          const isConfirmingDelete = confirmDeleteId === connection.id;
          const providerConfig = AI_PROVIDERS[connection.provider];
          const groupLabel =
            providerConfig.group === "local" ? "Local" : "Cloud";
          const status =
            testStatus?.id === connection.id ? testStatus : null;

          return (
            <li
              key={connection.id}
              className={styles.card}
              data-active={isActive || undefined}
            >
              <button
                type="button"
                className={styles.selectButton}
                aria-pressed={isActive}
                disabled={isBusy}
                onClick={() => {
                  setConfirmDeleteId(null);
                  onSelectActive(connection.id);
                }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.name}>{connection.name}</span>
                  <div className={styles.badges}>
                    {status ? (
                      <span
                        className={
                          status.ok ? styles.statusSuccess : styles.statusError
                        }
                      >
                        {status.ok ? (
                          <CheckCircle2 aria-hidden="true" size={13} />
                        ) : (
                          <XCircle aria-hidden="true" size={13} />
                        )}
                        {status.label}
                      </span>
                    ) : null}
                    {isActive ? (
                      <span className={styles.activeBadge}>Active</span>
                    ) : (
                      <span className={styles.useLabel}>Use</span>
                    )}
                  </div>
                </div>

                <div className={styles.meta}>
                  <span className={styles.provider}>
                    {providerConfig.label} · {groupLabel}
                  </span>
                  <span className={styles.model}>{connection.modelId}</span>
                  {connection.apiUrl ? (
                    <span className={styles.url}>{connection.apiUrl}</span>
                  ) : null}
                </div>
              </button>

              {isConfirmingDelete ? (
                <div className={styles.confirmRow} role="group" aria-label={`Delete ${connection.name}`}>
                  <span className={styles.confirmText}>
                    Delete this connection?
                  </span>
                  <div className={styles.confirmButtons}>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => {
                        setConfirmDeleteId(null);
                        onDelete(connection.id);
                      }}
                    >
                      Confirm delete
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.cardActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    isLoading={isTestingThis}
                    disabled={disabled || (testingId !== null && !isTestingThis)}
                    onClick={() => handleTest(connection)}
                  >
                    {isTestingThis ? "Testing..." : "Test"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => {
                      setConfirmDeleteId(null);
                      onEdit(connection);
                    }}
                  >
                    <Pencil aria-hidden="true" size={14} />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => setConfirmDeleteId(connection.id)}
                  >
                    <Trash2 aria-hidden="true" size={14} />
                    Delete
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
