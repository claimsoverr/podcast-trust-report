import { useState } from "react";
import { ConnectionList } from "@/components/ConnectionList";
import { SettingsForm } from "@/components/SettingsForm";
import { Drawer } from "@/components/ui";
import type { AIConnectionInput, AISettings } from "@/utils/settings";

type DrawerView =
  | { mode: "list" }
  | { mode: "add" }
  | { mode: "edit"; connectionId: string };

interface SettingsDrawerProps {
  open: boolean;
  settings: AISettings;
  disabled?: boolean;
  onClose: () => void;
  onSelectActive: (id: string) => void;
  onAddConnection: (input: AIConnectionInput) => void;
  onUpdateConnection: (id: string, input: AIConnectionInput) => void;
  onDeleteConnection: (id: string) => void;
}

interface SettingsDrawerContentProps {
  view: DrawerView;
  setView: (nextView: DrawerView) => void;
  settings: AISettings;
  disabled: boolean;
  onSelectActive: (id: string) => void;
  onAddConnection: (input: AIConnectionInput) => void;
  onUpdateConnection: (id: string, input: AIConnectionInput) => void;
  onDeleteConnection: (id: string) => void;
}

function SettingsDrawerContent({
  view,
  setView,
  settings,
  disabled,
  onSelectActive,
  onAddConnection,
  onUpdateConnection,
  onDeleteConnection,
}: SettingsDrawerContentProps) {
  const editingConnection =
    view.mode === "edit"
      ? settings.connections.find((conn) => conn.id === view.connectionId)
      : undefined;

  const effectiveView: DrawerView =
    view.mode === "edit" && !editingConnection ? { mode: "list" } : view;

  if (effectiveView.mode === "list") {
    return (
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
  disabled = false,
  onClose,
  onSelectActive,
  onAddConnection,
  onUpdateConnection,
  onDeleteConnection,
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
      closeLabel="Close settings"
      onClose={handleClose}
    >
      {open ? (
        <SettingsDrawerContent
          view={effectiveView}
          setView={setView}
          settings={settings}
          disabled={disabled}
          onSelectActive={onSelectActive}
          onAddConnection={onAddConnection}
          onUpdateConnection={onUpdateConnection}
          onDeleteConnection={onDeleteConnection}
        />
      ) : null}
    </Drawer>
  );
}
