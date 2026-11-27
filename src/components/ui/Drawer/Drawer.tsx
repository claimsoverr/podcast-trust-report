import { type PointerEvent, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useToastHost } from "@/notifications";
import { Button } from "../Button";
import styles from "./Drawer.module.css";
import type { DrawerProps } from "./Drawer.types";

function isPointerOutsideDialog(
  event: PointerEvent<HTMLDialogElement>,
  dialog: HTMLDialogElement,
): boolean {
  if (event.target !== dialog) {
    return false;
  }
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

export function Drawer({
  open,
  title,
  onClose,
  closeLabel = "Close",
  children,
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();
  const toastHost = useToastHost();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog || !toastHost) {
      return;
    }

    return toastHost.registerHost(dialog);
  }, [open, toastHost]);

  const handleClose = () => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = "";
    }
    onClose();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) {
      return;
    }
    pressedOutsideRef.current = isPointerOutsideDialog(event, dialog);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) {
      return;
    }
    const wasPressedOutside = pressedOutsideRef.current;
    pressedOutsideRef.current = false;
    if (wasPressedOutside && isPointerOutsideDialog(event, dialog)) {
      dialog.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.drawer}
      aria-labelledby={titleId}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...({ closedby: "any" } as Record<string, string>)}
    >
      <div className={styles.header}>
        <h1 id={titleId} className={styles.title}>
          {title}
        </h1>
        <form method="dialog">
          <Button
            type="submit"
            value="cancel"
            variant="ghost"
            size="sm"
            className={styles.closeButton}
            aria-label={closeLabel}
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </form>
      </div>
      <div className={styles.body}>{children}</div>
    </dialog>
  );
}
