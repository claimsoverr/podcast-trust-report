import { useState } from "react";
import { clsx } from "clsx";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "../Field";
import { formControlStyles } from "../FormControl";
import styles from "./Input.module.css";
import type { InputProps } from "./Input.types";

export function Input({
  label,
  hint,
  error,
  endAdornment,
  id,
  required,
  className,
  type,
  disabled,
  ...rest
}: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const isPasswordField = type === "password";
  const resolvedType =
    isPasswordField && !endAdornment && revealed ? "text" : type;

  const resolvedAdornment =
    endAdornment ??
    (isPasswordField ? (
      <button
        type="button"
        className={styles.revealButton}
        aria-label={revealed ? "Hide value" : "Show value"}
        aria-pressed={revealed}
        disabled={disabled}
        onClick={() => setRevealed((prev) => !prev)}
      >
        {revealed ? (
          <EyeOff aria-hidden="true" size={16} />
        ) : (
          <Eye aria-hidden="true" size={16} />
        )}
      </button>
    ) : null);

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      id={id}
      required={required}
      className={className}
    >
      {(controlProps) => (
        <div className={styles.wrap}>
          <input
            type={resolvedType}
            disabled={disabled}
            className={clsx(
              formControlStyles.control,
              resolvedAdornment && styles.hasEndAdornment,
            )}
            {...controlProps}
            {...rest}
          />
          {resolvedAdornment ? (
            <div className={styles.endAdornment}>{resolvedAdornment}</div>
          ) : null}
        </div>
      )}
    </Field>
  );
}
