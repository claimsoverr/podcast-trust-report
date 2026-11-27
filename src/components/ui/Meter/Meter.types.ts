import type { HTMLAttributes } from "react";

export type MeterTone = "accent" | "success" | "warning" | "danger";

export interface MeterProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  min?: number;
  max?: number;
  label: string;
  valueText?: string;
  tone?: MeterTone;
  showValue?: boolean;
}
