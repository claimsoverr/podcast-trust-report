import { clsx } from "clsx";
import styles from "./Stat.module.css";
import type { StatProps } from "./Stat.types";

export function Stat({
  label,
  value,
  hint,
  mono = false,
  className,
  ...rest
}: StatProps) {
  return (
    <div className={clsx(styles.stat, className)} {...rest}>
      <span className={styles.label}>{label}</span>
      <span className={clsx(styles.value, mono && styles.mono)}>{value}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
