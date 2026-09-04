import { AuditionSpectrum } from "./AuditionSpectrum";
import { useEffect, useState } from "react";
import { IconPlayerPlay } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const CHORD_ROOTS = Array.from({ length: 12 }, (_, index) => 48 + index);
const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

function noteLabel(note: number): string {
  return `${NOTE_NAMES[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`;
}

/** The roster body; its heading and description come from the panel definition. */
export function AuditionPanel() {
  const music = useMusicSession();
  const root = getMusicRoot(music.rootId);
  const [styleId, setStyleId] = useState<(typeof AUDITION_VOICES)[number]["id"]>(root.luteStyle);
  const [rootPitch, setRootPitch] = useState(48);
  const chordVoice = AUDITION_VOICES.find((voice) => voice.id === styleId) ?? AUDITION_VOICES[0];
  // Leaving the instruments tab must not leave the audition context's audio thread
  // running for the rest of the session.
  useEffect(() => suspendAuditionEngine, []);
  if (!chordVoice) return null;
  return (
    <>
      <AuditionSpectrum />
      <div role="group" aria-label="Exact chord audition" className="space-y-3 rounded-lg border p-3">
        <div>
          <p className="text-xs font-medium">Exact chord audition</p>
          <p className="text-2xs text-muted-foreground">
            Uses the current {root.mode} mode, {music.chords.strumMs} ms strum, and effects rack.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Lute body</Label>
            <Select
              items={AUDITION_VOICES.map((voice) => ({ value: voice.id, label: voice.name }))}
              value={styleId}
              onValueChange={(value) => value && setStyleId(value as (typeof AUDITION_VOICES)[number]["id"])}
            >
              <SelectTrigger aria-label="Chord audition lute body" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDITION_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Root course</Label>
            <Select
              items={CHORD_ROOTS.map((note) => ({ value: note.toString(), label: noteLabel(note) }))}
              value={rootPitch.toString()}
              onValueChange={(value) => value && setRootPitch(Number(value))}
            >
              <SelectTrigger aria-label="Chord audition root note" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHORD_ROOTS.map((note) => (
                  <SelectItem key={note} value={note.toString()}>
                    {noteLabel(note)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {AUDITION_CHORD_VOICINGS.map((voicing) => {
            const pitches = auditionChordPitches(rootPitch, root.mode, voicing.id);
            return (
              <Button
                key={voicing.id}
                size="sm"
                variant="outline"
                className="h-auto min-h-12 justify-start px-2 py-1.5 text-left"
                aria-label={`Preview ${voicing.name} ${pitches.map(noteLabel).join(" ")}`}
                onClick={() =>
                  void auditionChord(chordVoice, rootPitch, root.mode, voicing.id, music.chords.strumMs, music.effects)
                }
              >
                <IconPlayerPlay />
                <span>
                  <span className="block text-2xs font-medium">{voicing.name}</span>
                  <span className="block font-mono text-2xs text-muted-foreground">
                    {pitches.map(noteLabel).join(" · ")}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </div>
      <div className="divide-y rounded-lg border">
        {AUDITION_VOICES.map((voice) => (
          <div key={voice.id} className="flex items-center gap-1.5 p-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{voice.name}</p>
              <p className="text-2xs text-muted-foreground">{voice.description}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-2xs"
              onClick={() => void auditionVoice(voice, "note", music.effects)}
            >
              <IconPlayerPlay />
              Note
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-2xs"
              onClick={() => void auditionVoice(voice, "phrase", music.effects)}
            >
              Phrase
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
