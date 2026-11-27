import { clsx } from "clsx";
import styles from "./Badge.module.css";
import type { BadgeProps, BadgeTone } from "./Badge.types";

const TONE_CLASSES: Record<Exclude<BadgeTone, "neutral">, string> = {
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
};

export function Badge({
  tone = "neutral",
  mono = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={clsx(
        styles.badge,
        tone !== "neutral" && TONE_CLASSES[tone],
        mono && styles.mono,
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
