import * as stylex from "@stylexjs/stylex";
import { controlStyles } from "./controlStyles";
import { Field } from "./Field";

export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        {...stylex.props(controlStyles.input, controlStyles.focus)}
        onChange={(event) => {
          if (Number.isFinite(event.currentTarget.valueAsNumber)) onChange(event.currentTarget.valueAsNumber);
        }}
      />
    </Field>
  );
}
