import { Drawer } from "@/components/ui";
import { SettingsForm } from "@/components/SettingsForm";
import type { AISettings } from "@/utils/settings";

interface SettingsDrawerProps {
  open: boolean;
  settings: AISettings;
  hasSavedSettings: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSave: (nextSettings: AISettings) => void;
  onClear: () => void;
}

export function SettingsDrawer({
  open,
  settings,
  hasSavedSettings,
  disabled = false,
  onClose,
  onSave,
  onClear,
}: SettingsDrawerProps) {
  return (
    <Drawer
      open={open}
      title="AI Settings"
      closeLabel="Close settings"
      onClose={onClose}
    >
      {open ? (
        <SettingsForm
          settings={settings}
          hasSavedSettings={hasSavedSettings}
          disabled={disabled}
          onSave={onSave}
          onClear={onClear}
        />
      ) : null}
    </Drawer>
  );
}
