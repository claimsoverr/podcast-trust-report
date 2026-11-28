import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ConnectionList } from "@/components/ConnectionList";
import { GeneralSettingsForm } from "@/components/GeneralSettingsForm";
import { SettingsForm } from "@/components/SettingsForm";
import { Drawer } from "@/components/ui";
import type { AIGeneralSettings } from "@/utils/aiGeneralSettings";
import type { AIConnectionInput, AISettings } from "@/utils/settings";
import styles from "./SettingsDrawer.module.css";

type DrawerView =
  | { mode: "list" }
  | { mode: "add" }
  | { mode: "edit"; connectionId: string };

interface SettingsDrawerProps {
  open: boolean;
  settings: AISettings;
  generalSettings: AIGeneralSettings;
  disabled?: boolean;
  onClose: () => void;
  onSelectActive: (id: string) => void;
  onAddConnection: (input: AIConnectionInput) => void;
  onUpdateConnection: (id: string, input: AIConnectionInput) => void;
  onDeleteConnection: (id: string) => void;
  onSaveGeneralSettings: (nextSettings: AIGeneralSettings) => void;
}

interface SettingsDrawerContentProps {
  view: DrawerView;
  setView: (nextView: DrawerView) => void;
  settings: AISettings;
  generalSettings: AIGeneralSettings;
  disabled: boolean;
  onSelectActive: (id: string) => void;
  onAddConnection: (input: AIConnectionInput) => void;
  onUpdateConnection: (id: string, input: AIConnectionInput) => void;
  onDeleteConnection: (id: string) => void;
  onSaveGeneralSettings: (nextSettings: AIGeneralSettings) => void;
}

function getGeneralBadge(generalSettings: AIGeneralSettings): string {
  if (generalSettings.corsProxyUrl.trim().length > 0) {
    return "Proxy configured";
  }
  return import.meta.env.DEV ? "Dev proxy" : "Not set";
}

function SettingsDrawerContent({
  view,
  setView,
  settings,
  generalSettings,
  disabled,
  onSelectActive,
  onAddConnection,
  onUpdateConnection,
  onDeleteConnection,
  onSaveGeneralSettings,
}: SettingsDrawerContentProps) {
  const editingConnection =
    view.mode === "edit"
      ? settings.connections.find((conn) => conn.id === view.connectionId)
      : undefined;

  const effectiveView: DrawerView =
    view.mode === "edit" && !editingConnection ? { mode: "list" } : view;

  if (effectiveView.mode === "list") {
    const connectionCount = settings.connections.length;
    const connectionBadge =
      connectionCount === 0 ? "None" : `${connectionCount} saved`;

    return (
      <div className={styles.sections}>
        <details className={styles.section}>
          <summary className={styles.sectionSummary}>
            <span className={styles.sectionHeadingGroup}>
              <ChevronRight
                aria-hidden="true"
                size={15}
                className={styles.chevron}
              />
              <span className={styles.sectionTitle}>General</span>
            </span>
            <span className={styles.sectionBadge}>
              {getGeneralBadge(generalSettings)}
            </span>
          </summary>
          <div className={styles.sectionBody}>
            <GeneralSettingsForm
              key={generalSettings.corsProxyUrl}
              settings={generalSettings}
              disabled={disabled}
              onSave={onSaveGeneralSettings}
            />
          </div>
        </details>

        <details className={styles.section} open>
          <summary className={styles.sectionSummary}>
            <span className={styles.sectionHeadingGroup}>
              <ChevronRight
                aria-hidden="true"
                size={15}
                className={styles.chevron}
              />
              <span className={styles.sectionTitle}>Connections</span>
            </span>
            <span className={styles.sectionBadge}>{connectionBadge}</span>
          </summary>
          <div className={styles.sectionBody}>
            <ConnectionList
              connections={settings.connections}
              activeConnectionId={settings.activeConnectionId}
              disabled={disabled}
              onSelectActive={onSelectActive}
              onAdd={() => setView({ mode: "add" })}
              onEdit={(connection) =>
                setView({ mode: "edit", connectionId: connection.id })
              }
              onDelete={onDeleteConnection}
            />
          </div>
        </details>
      </div>
    );
  }

  return (
    <SettingsForm
      key={
        effectiveView.mode === "edit"
          ? effectiveView.connectionId
          : "add"
      }
      initialConnection={editingConnection}
      disabled={disabled}
      onSave={(input) => {
        if (effectiveView.mode === "edit" && editingConnection) {
          onUpdateConnection(editingConnection.id, input);
        } else {
          onAddConnection(input);
        }
        setView({ mode: "list" });
      }}
      onCancel={() => setView({ mode: "list" })}
    />
  );
}

export function SettingsDrawer({
  open,
  settings,
  generalSettings,
  disabled = false,
  onClose,
  onSelectActive,
  onAddConnection,
  onUpdateConnection,
  onDeleteConnection,
  onSaveGeneralSettings,
}: SettingsDrawerProps) {
  const [view, setView] = useState<DrawerView>({ mode: "list" });

  const editingConnection =
    view.mode === "edit"
      ? settings.connections.find((conn) => conn.id === view.connectionId)
      : undefined;

  const effectiveView: DrawerView =
    view.mode === "edit" && !editingConnection ? { mode: "list" } : view;

  const title =
    open && effectiveView.mode === "add"
      ? "Add AI Connection"
      : open && effectiveView.mode === "edit"
        ? "Edit AI Connection"
        : "AI Settings";

  const handleClose = () => {
    setView({ mode: "list" });
    onClose();
  };

  return (
    <Drawer
      open={open}
      title={title}
      closeLabel="Close AI settings"
      onClose={handleClose}
    >
      {open ? (
        <SettingsDrawerContent
          view={effectiveView}
          setView={setView}
          settings={settings}
          generalSettings={generalSettings}
          disabled={disabled}
          onSelectActive={onSelectActive}
          onAddConnection={onAddConnection}
          onUpdateConnection={onUpdateConnection}
          onDeleteConnection={onDeleteConnection}
          onSaveGeneralSettings={onSaveGeneralSettings}
        />
      ) : null}
    </Drawer>
  );
}
