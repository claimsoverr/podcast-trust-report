import { type MouseEvent, useState } from "react";
import { ChevronRight, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import {
  formatDuration,
  formatSavedTimestamp,
  formatTokenCount,
  formatWebSearchSummary,
} from "@/utils/format";
import { AI_PROVIDERS } from "@/utils/providers";
import type { SavedTrustReport } from "@/utils/reportHistory";
import styles from "./ReportHistory.module.css";

interface ReportHistoryProps {
  entries: readonly SavedTrustReport[];
  activeReportId: string | null;
  open: boolean;
  disabled?: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (entry: SavedTrustReport) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

interface ReportHistoryBodyProps {
  entries: readonly SavedTrustReport[];
  activeReportId: string | null;
  disabled: boolean;
  onLoad: (entry: SavedTrustReport) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

function ReportHistoryBody({
  entries,
  activeReportId,
  disabled,
  onLoad,
  onDelete,
  onClearAll,
}: ReportHistoryBodyProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  return (
    <div className={styles.body}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarHint}>
          Stored locally in this browser.
        </span>

        {confirmClearAll ? (
          <div
            className={styles.clearConfirmGroup}
            role="group"
            aria-label="Clear all saved Trust Reports"
          >
            <span className={styles.confirmText}>
              Clear all {entries.length}{" "}
              {entries.length === 1 ? "report" : "reports"}?
            </span>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={disabled}
              onClick={() => {
                setConfirmClearAll(false);
                onClearAll();
              }}
            >
              Confirm clear
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => setConfirmClearAll(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => {
              setConfirmDeleteId(null);
              setConfirmClearAll(true);
            }}
          >
            <Trash2 aria-hidden="true" size={14} />
            Clear all
          </Button>
        )}
      </div>

      <ul className={styles.list} aria-label="Saved Trust Reports">
        {entries.map((entry) => {
          const isActive = entry.id === activeReportId;
          const isConfirmingDelete = confirmDeleteId === entry.id;
          const providerLabel = AI_PROVIDERS[entry.provider].label;

          return (
            <li
              key={entry.id}
              className={styles.card}
              data-active={isActive || undefined}
            >
              <button
                type="button"
                className={styles.selectButton}
                aria-pressed={isActive}
                disabled={disabled}
                onClick={() => {
                  setConfirmDeleteId(null);
                  setConfirmClearAll(false);
                  onLoad(entry);
                }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.episodeTitle}>
                    {entry.metadata.title}
                  </span>
                  {isActive ? (
                    <span className={styles.activeBadge}>Loaded</span>
                  ) : (
                    <span className={styles.loadLabel}>Load</span>
                  )}
                </div>

                <div className={styles.subline}>
                  <span className={styles.author}>{entry.metadata.author}</span>
                  <span className={styles.timestamp}>
                    {formatSavedTimestamp(entry.savedAt)}
                  </span>
                </div>

                <div className={styles.meta}>
                  <span className={styles.connectionMeta}>
                    {entry.connectionName} · {providerLabel} · {entry.modelId}
                  </span>
                  <div className={styles.statsRow}>
                    {entry.usage ? (
                      <span className={styles.stat}>
                        {formatTokenCount(entry.usage.totalTokens)}
                      </span>
                    ) : null}
                    {entry.durationMs !== null ? (
                      <span className={styles.stat}>
                        {formatDuration(entry.durationMs)}
                      </span>
                    ) : null}
                    <span className={styles.stat}>
                      Web:{" "}
                      {formatWebSearchSummary(
                        entry.webSearchMode,
                        entry.webSearchCount,
                      )}
                    </span>
                  </div>
                </div>
              </button>

              {isConfirmingDelete ? (
                <div
                  className={styles.confirmRow}
                  role="group"
                  aria-label={`Delete ${entry.metadata.title}`}
                >
                  <span className={styles.confirmText}>
                    Delete this report?
                  </span>
                  <div className={styles.confirmButtons}>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={disabled}
                      onClick={() => {
                        setConfirmDeleteId(null);
                        onDelete(entry.id);
                      }}
                    >
                      Confirm delete
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={disabled}
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
                    disabled={disabled}
                    onClick={() => {
                      setConfirmDeleteId(null);
                      setConfirmClearAll(false);
                      onLoad(entry);
                    }}
                  >
                    {isActive ? "Loaded" : "Load"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => {
                      setConfirmClearAll(false);
                      setConfirmDeleteId(entry.id);
                    }}
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

export function ReportHistory({
  entries,
  activeReportId,
  open,
  disabled = false,
  onOpenChange,
  onLoad,
  onDelete,
  onClearAll,
}: ReportHistoryProps) {
  if (entries.length === 0) {
    return null;
  }

  const handleSummaryClick = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onOpenChange(!open);
  };

  return (
    <section className={styles.wrapper} aria-label="Trust Report history">
      <details className={styles.section} open={open}>
        <summary className={styles.summary} onClick={handleSummaryClick}>
          <span className={styles.headingGroup}>
            <ChevronRight
              aria-hidden="true"
              size={15}
              className={styles.chevron}
            />
            <History aria-hidden="true" size={15} className={styles.icon} />
            <span className={styles.title}>History</span>
          </span>
          <span className={styles.badge}>{entries.length} saved</span>
        </summary>

        {open ? (
          <ReportHistoryBody
            entries={entries}
            activeReportId={activeReportId}
            disabled={disabled}
            onLoad={onLoad}
            onDelete={onDelete}
            onClearAll={onClearAll}
          />
        ) : null}
      </details>
    </section>
  );
}
