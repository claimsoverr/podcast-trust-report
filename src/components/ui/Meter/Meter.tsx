import { clsx } from "clsx";
import styles from "./Meter.module.css";
import type { MeterProps, MeterTone } from "./Meter.types";

const TONE_CLASSES: Record<Exclude<MeterTone, "accent">, string> = {
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
};

function clampValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  valueText,
  tone = "accent",
  showValue = true,
  className,
  ...rest
}: MeterProps) {
  const safeMax = max > min ? max : min + 100;
  const clamped = clampValue(value, min, safeMax);
  const percent = ((clamped - min) / (safeMax - min)) * 100;
  const displayValue = valueText ?? `${Math.round(clamped)}`;

  return (
    <div
      className={clsx(
        styles.meter,
        tone !== "accent" && TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {showValue ? <span className={styles.value}>{displayValue}</span> : null}
      </div>
      <div
        className={styles.track}
        role="meter"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        aria-valuetext={displayValue}
      >
        <div className={styles.fill} style={{ inlineSize: `${percent}%` }} />
      </div>
    </div>
  );
}
