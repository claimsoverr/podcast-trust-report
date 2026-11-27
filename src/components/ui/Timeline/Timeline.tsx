import { clsx } from "clsx";
import styles from "./Timeline.module.css";
import type { TimelineItemProps, TimelineProps } from "./Timeline.types";

export function Timeline({ className, children, ...rest }: TimelineProps) {
  return (
    <ol className={clsx(styles.timeline, className)} {...rest}>
      {children}
    </ol>
  );
}

export function TimelineItem({
  time,
  title,
  description,
  className,
  ...rest
}: TimelineItemProps) {
  return (
    <li className={clsx(styles.item, className)} {...rest}>
      <div className={styles.time}>{time}</div>
      <div className={styles.body}>
        <div className={styles.title}>{title}</div>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
    </li>
  );
}
