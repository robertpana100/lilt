import type { ReactNode } from "react";
const SECTIONS = {
  playback: "Playback",
  root: "Atmosphere",
  "now-playing": "Current take",
  voices: "Voices",
  "rhythm-lute": "Rhythm lute",
  audition: "Audition",
  harmony: "Harmony",
  effects: "Effects",
  composition: "Composition",
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
  return (
    <section aria-labelledby={`sound-desk-${id}`} className="control-section">
      <div className="section-heading">
        <h3 id={`sound-desk-${id}`}>{SECTIONS[id]}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}
