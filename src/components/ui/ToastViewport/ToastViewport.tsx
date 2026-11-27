import { type FocusEvent, useEffect, useRef } from "react";
import { clsx } from "clsx";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Button } from "../Button";
import styles from "./ToastViewport.module.css";
import type { ToastTone, ToastViewportProps } from "./ToastViewport.types";

const TONE_CLASSES: Record<ToastTone, string> = {
  info: styles.info,
  success: styles.success,
  error: styles.error,
};

const TONE_LABELS: Record<ToastTone, string> = {
  info: "Info",
  success: "Success",
  error: "Error",
};

function ToastToneIcon({ tone }: { tone: ToastTone }) {
  const iconProps = {
    "aria-hidden": true as const,
    size: 18,
    className: styles.icon,
  };

  switch (tone) {
    case "success": {
      return <CheckCircle2 {...iconProps} />;
    }
    case "error": {
      return <XCircle {...iconProps} />;
    }
    case "info": {
      return <Info {...iconProps} />;
    }
  }
}

export function ToastViewport({
  toasts,
  onDismiss,
  regionLabel = "Notifications",
  dismissLabel = "Dismiss notification",
  srAnnouncementLabel = "Screen reader announcements",
}: ToastViewportProps) {
  const regionRef = useRef<HTMLDivElement>(null);
  const closeButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const lastPromotedIdRef = useRef<string | undefined>(undefined);
  const latestToast = toasts[toasts.length - 1];
  const announcement = latestToast
    ? latestToast.action
      ? `${latestToast.message} Actions available.`
      : latestToast.message
    : "";

  useEffect(() => {
    const el = regionRef.current;
    if (!el || typeof el.showPopover !== "function") {
      return;
    }

    try {
      if (toasts.length > 0) {
        const isOpen = el.matches(":popover-open");
        const isNewToast = latestToast?.id !== lastPromotedIdRef.current;
        if (!isOpen || isNewToast) {
          if (isOpen) {
            el.hidePopover();
          }
          el.showPopover();
        }
        lastPromotedIdRef.current = latestToast?.id;
      } else {
        lastPromotedIdRef.current = undefined;
        if (el.matches(":popover-open")) {
          el.hidePopover();
        }
      }
    } catch {
      // Ignore popover state transitions when DOM is detaching
    }
  }, [toasts.length, latestToast?.id]);

  useEffect(() => {
    if (!announcement) {
      return;
    }

    const docWithNotify = document as Document & {
      ariaNotify?: (message: string) => void;
    };
    if (typeof docWithNotify.ariaNotify === "function") {
      docWithNotify.ariaNotify(announcement);
    }
  }, [latestToast?.id, announcement]);

  const handleRegionFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    const region = regionRef.current;
    const related = event.relatedTarget;
    if (
      region &&
      related instanceof HTMLElement &&
      !region.contains(related)
    ) {
      previousFocusRef.current = related;
    }
  };

  const handleManualDismiss = (id: string, index: number) => {
    const remaining = toasts.filter((item) => item.id !== id);
    onDismiss(id);

    requestAnimationFrame(() => {
      if (remaining.length > 0) {
        const nextToast =
          remaining[Math.min(index, remaining.length - 1)] ?? remaining[0];
        const nextButton = closeButtonRefs.current.get(nextToast.id);
        if (nextButton) {
          nextButton.focus();
        }
        return;
      }

      const priorFocus = previousFocusRef.current;
      previousFocusRef.current = null;
      if (priorFocus && priorFocus.isConnected) {
        priorFocus.focus();
      }
    });
  };

  return (
    <>
      <p className="visually-hidden">{srAnnouncementLabel}</p>
      <div
        className="visually-hidden"
        aria-live={latestToast?.tone === "error" ? "assertive" : "polite"}
      >
        {announcement}
      </div>

      <div
        ref={regionRef}
        popover="manual"
        role="region"
        aria-label={regionLabel}
        className={styles.region}
        onFocusCapture={handleRegionFocusCapture}
      >
        {toasts.map((item, index) => (
          <div
            key={item.id}
            id={`toast-${item.id}`}
            className={clsx(styles.toast, TONE_CLASSES[item.tone])}
          >
            <div className={styles.body}>
              <div className={styles.content}>
                <ToastToneIcon tone={item.tone} />
                <span className="visually-hidden">
                  {TONE_LABELS[item.tone]}:{" "}
                </span>
                <span className={styles.message}>{item.message}</span>
              </div>

              {item.action ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    item.action?.onClick();
                    onDismiss(item.id);
                  }}
                >
                  {item.action.label}
                </Button>
              ) : null}
            </div>

            <button
              ref={(node) => {
                if (node) {
                  closeButtonRefs.current.set(item.id, node);
                } else {
                  closeButtonRefs.current.delete(item.id);
                }
              }}
              type="button"
              className={styles.close}
              aria-label={dismissLabel}
              onClick={() => handleManualDismiss(item.id, index)}
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
