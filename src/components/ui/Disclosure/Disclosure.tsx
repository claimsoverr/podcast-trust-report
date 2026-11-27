import { clsx } from "clsx";
import { ChevronRight } from "lucide-react";
import styles from "./Disclosure.module.css";
import type { DisclosureProps } from "./Disclosure.types";

export function Disclosure({
  summary,
  className,
  children,
  ...rest
}: DisclosureProps) {
  return (
    <details className={clsx(styles.disclosure, className)} {...rest}>
      <summary className={styles.summary}>
        <ChevronRight aria-hidden="true" size={14} className={styles.chevron} />
        <span>{summary}</span>
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
