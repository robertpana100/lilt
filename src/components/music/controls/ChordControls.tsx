import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { RangeField } from "@/components/ui/RangeField";

/** Shared voicing controls for the melody and accompaniment lutes. */
export function ChordControls({
  part,
  maxNotes,
  strumMs,
  onMaxNotesChange,
  onStrumChange,
}: {
  part: "Melody" | "Accompaniment";
  maxNotes: 2 | 3;
  strumMs: number;
  onMaxNotesChange: (notes: 2 | 3) => void;
  onStrumChange: (milliseconds: number) => void;
}) {
  return (
    <>
      <Field label="Chord size">
        <Select
          aria-label={`${part} chord size`}
          value={String(maxNotes)}
          options={[
            { value: "2", label: "Up to 2 notes" },
            { value: "3", label: "Up to 3 notes" },
          ]}
          onValueChange={(value) => onMaxNotesChange(value === "2" ? 2 : 3)}
        />
      </Field>
      <RangeField
        label="Strum spacing"
        ariaLabel={`${part} strum spacing`}
        value={strumMs}
        max={40}
        display={`${strumMs} ms`}
        description="Time between notes in a chord."
        onChange={onStrumChange}
      />
    </>
  );
}
