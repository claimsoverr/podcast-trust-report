import type { HTMLAttributes, ReactNode } from "react";

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  hint?: string;
  mono?: boolean;
}
