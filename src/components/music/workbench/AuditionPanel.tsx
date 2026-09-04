import { useEffect, useState } from "react";
import {
  AUDITION_CHORD_VOICINGS,
  AUDITION_VOICES,
  auditionChord,
  auditionChordPitches,
  auditionVoice,
  suspendAuditionEngine,
} from "@/audio/debug/audition";
import { getMusicRoot } from "@/audio/composition/roots";
import { useMusicSession } from "@/audio/playback/react";
import { midiLabel } from "./music-labels";
import { AuditionSpectrum } from "./AuditionSpectrum";

const CHORD_ROOTS = Array.from({ length: 12 }, (_, index) => 48 + index);

export function AuditionPanel() {
  const music = useMusicSession();
  const root = getMusicRoot(music.rootId);
  const [styleId, setStyleId] = useState<(typeof AUDITION_VOICES)[number]["id"]>(root.luteStyle);
  const [rootPitch, setRootPitch] = useState(48);
  const voice = AUDITION_VOICES.find((entry) => entry.id === styleId) ?? AUDITION_VOICES[0];
  useEffect(() => suspendAuditionEngine, []);
  if (!voice) return null;
  return (
    <>
      <div className="control-grid">
        <label className="field">
          Lute body
          <select
            aria-label="Chord audition lute body"
            value={styleId}
            onChange={(event) => setStyleId(event.currentTarget.value as typeof styleId)}
          >
            {AUDITION_VOICES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Root note
          <select
            aria-label="Chord audition root note"
            value={rootPitch}
            onChange={(event) => setRootPitch(Number(event.currentTarget.value))}
          >
            {CHORD_ROOTS.map((note) => (
              <option key={note} value={note}>
                {midiLabel(note)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="button-row">
        <button type="button" onClick={() => void auditionVoice(voice, "note", music.effects)}>
          Play note
        </button>
        <button type="button" onClick={() => void auditionVoice(voice, "phrase", music.effects)}>
          Play phrase
        </button>
        {AUDITION_CHORD_VOICINGS.map((voicing) => (
          <button
            type="button"
            key={voicing.id}
            aria-label={`Preview ${voicing.name} ${auditionChordPitches(rootPitch, root.mode, voicing.id).map(midiLabel).join(" ")}`}
            onClick={() =>
              void auditionChord(voice, rootPitch, root.mode, voicing.id, music.chords.strumMs, music.effects)
            }
          >
            {voicing.name}
          </button>
        ))}
      </div>
      <AuditionSpectrum />
    </>
  );
}
