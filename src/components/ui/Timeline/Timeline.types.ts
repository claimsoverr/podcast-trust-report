import type { OlHTMLAttributes, LiHTMLAttributes, ReactNode } from "react";

export interface TimelineProps extends OlHTMLAttributes<HTMLOListElement> {
  children: ReactNode;
}

export interface TimelineItemProps extends Omit<
  LiHTMLAttributes<HTMLLIElement>,
  "title"
> {
  time: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}
