import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ToastViewport } from "@/components/ui";
import type { ToastItem, ToastTone } from "@/components/ui";
import type {
  NotificationContextValue,
  NotificationProviderProps,
  NotifyOptions,
  ToastHostContextValue,
} from "./types";

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);
const ToastHostContext = createContext<ToastHostContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hosts, setHosts] = useState<HTMLElement[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timerId = timersRef.current.get(id);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timersRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timerId of timers.values()) {
        window.clearTimeout(timerId);
      }
      timers.clear();
    };
  }, []);

  const notify = useCallback(
    (tone: ToastTone, message: string, options?: NotifyOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setToasts((prev) => [
        ...prev,
        { id, tone, message, action: options?.action },
      ]);

      if (tone !== "error" && !options?.action) {
        const timerId = window.setTimeout(() => {
          dismiss(id);
        }, AUTO_DISMISS_MS);
        timersRef.current.set(id, timerId);
      }
    },
    [dismiss],
  );

  const notifySuccess = useCallback(
    (message: string, options?: NotifyOptions) => {
      notify("success", message, options);
    },
    [notify],
  );

  const notifyError = useCallback(
    (message: string, options?: NotifyOptions) => {
      notify("error", message, options);
    },
    [notify],
  );

  const notifyInfo = useCallback(
    (message: string, options?: NotifyOptions) => {
      notify("info", message, options);
    },
    [notify],
  );

  const registerHost = useCallback((host: HTMLElement) => {
    setHosts((prev) => {
      if (prev.includes(host)) {
        return prev;
      }
      return [...prev, host];
    });

    return () => {
      setHosts((prev) => prev.filter((item) => item !== host));
    };
  }, []);

  const notificationValue = useMemo<NotificationContextValue>(
    () => ({
      notify,
      notifySuccess,
      notifyError,
      notifyInfo,
      dismiss,
    }),
    [notify, notifySuccess, notifyError, notifyInfo, dismiss],
  );

  const toastHostValue = useMemo<ToastHostContextValue>(
    () => ({ registerHost }),
    [registerHost],
  );

  const activeHost = hosts[hosts.length - 1] ?? null;
  const viewport = <ToastViewport toasts={toasts} onDismiss={dismiss} />;

  return (
    <NotificationContext value={notificationValue}>
      <ToastHostContext value={toastHostValue}>
        {children}
        {activeHost ? createPortal(viewport, activeHost) : viewport}
      </ToastHostContext>
    </NotificationContext>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

export function useToastHost(): ToastHostContextValue | null {
  return useContext(ToastHostContext);
}
