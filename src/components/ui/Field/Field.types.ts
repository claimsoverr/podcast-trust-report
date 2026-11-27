import type { ReactNode } from "react";

export interface FieldControlProps {
  id: string;
  required?: boolean;
  "aria-invalid"?: "true";
  "aria-describedby"?: string;
}

export interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  id?: string;
  required?: boolean;
  className?: string;
  children: ReactNode | ((controlProps: FieldControlProps) => ReactNode);
}
