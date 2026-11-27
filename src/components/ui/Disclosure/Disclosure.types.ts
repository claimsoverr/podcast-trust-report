import type { DetailsHTMLAttributes, ReactNode } from "react";

export interface DisclosureProps extends DetailsHTMLAttributes<HTMLDetailsElement> {
  summary: ReactNode;
  children: ReactNode;
}
