import { Field } from "../Field";
import { formControlStyles } from "../FormControl";
import type { SelectProps } from "./Select.types";

export function Select({
  label,
  options,
  groups,
  hint,
  error,
  id,
  required,
  className,
  ...rest
}: SelectProps) {
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
        <select
          className={formControlStyles.control}
          {...controlProps}
          {...rest}
        >
          {groups
            ? groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                    >
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))
            : options?.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ))}
        </select>
      )}
    </Field>
  );
}
