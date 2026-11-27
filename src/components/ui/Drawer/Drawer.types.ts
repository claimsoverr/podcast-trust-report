import type { ReactNode } from "react";

export interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  closeLabel?: string;
  children: ReactNode;
}
