import type { ReactNode } from "react";
const SECTIONS = {
  playback: { title: "Playback", description: "Set the level, or jump to a moment in the current take." },
  root: { title: "Musical vocabulary", description: "Choose a coherent atmosphere, mode, and metre." },
  "now-playing": {
    title: "The current take",
    description: "A new composition, a variation, or a different performance.",
  },
  voices: { title: "The ensemble", description: "Hear the lead and accompaniment together or on their own." },
  "rhythm-lute": { title: "Rhythm lute", description: "Shape the second lute’s pulse, harmony, and strum." },
  audition: { title: "Try the instruments", description: "Preview a single note, a phrase, or an exact chord." },
  harmony: { title: "Chord voicing", description: "Give the lead more harmony, or leave it a single line." },
  effects: {
    title: "Effects rack",
    description:
      "Each generated take varies the rack. These switches show the sounding take; changes apply immediately.",
  },
  composition: { title: "Composition", description: "Set the seed, tempo, form, and performance detail." },
} as const;
export function ControlSection({
  id,
  aside,
  children,
}: {
  id: keyof typeof SECTIONS;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const section = SECTIONS[id];
  return (
    <section aria-labelledby={`sound-desk-${id}`} className="control-section">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`sound-desk-${id}`}>{section.title}</h3>
          <p>{section.description}</p>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
