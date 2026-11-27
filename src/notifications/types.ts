import type { ReactNode } from "react";
import type { ToastAction, ToastTone } from "@/components/ui";

export interface NotifyOptions {
  action?: ToastAction;
}

export interface NotificationContextValue {
  notify: (tone: ToastTone, message: string, options?: NotifyOptions) => void;
  notifySuccess: (message: string, options?: NotifyOptions) => void;
  notifyError: (message: string, options?: NotifyOptions) => void;
  notifyInfo: (message: string, options?: NotifyOptions) => void;
  dismiss: (id: string) => void;
}

export interface ToastHostContextValue {
  registerHost: (host: HTMLElement) => () => void;
}

export interface NotificationProviderProps {
  children: ReactNode;
}
