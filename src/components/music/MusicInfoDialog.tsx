import { useLayoutEffect, useRef, useState } from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MAX_MUSIC_FAVORITES, MAX_MUSIC_HISTORY } from "@/audio/musicLibrary";
import { LUTE_STYLES, MUSIC_FORM_LABELS, MUSIC_ROOTS } from "@/audio/composition/roots";

/**
 * Lists are read from the registries rather than written out here.
 *
 * Modes, forms, and lute bodies are read from their registries so the
 * explanation cannot drift from the composer or synth.
 */
function sentence(names: readonly string[]): string {
  if (names.length < 2) return names[0] ?? "";
  // Exactly two names take no comma: "A and B", not "A, and B".
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

const LUTE_STYLE_SENTENCE = sentence(LUTE_STYLES.map((style) => style.name));
const MODE_SENTENCE = sentence(
  [...new Set(MUSIC_ROOTS.map((root) => root.mode))].map((mode) => `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`),
);
const FORM_SENTENCE = sentence(Object.values(MUSIC_FORM_LABELS));

export function MusicInfoDialog() {
  const [open, setOpen] = useState(false);
  const scrollPanelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (open && scrollPanelRef.current) scrollPanelRef.current.scrollTop = 0;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <IconInfoCircle />
        How the music works
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>How the procedural score works</DialogTitle>
          <DialogDescription>
            Lilt composes its music as you listen. Here is what “medieval,” “procedural,” and “saved” mean in the Lilt
            studio.
          </DialogDescription>
        </DialogHeader>
        <div
          ref={scrollPanelRef}
          data-music-info-scroll-panel
          className="min-h-0 space-y-5 overflow-y-auto overscroll-contain pr-1 text-sm leading-6"
        >
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="font-medium">Historically informed, not a historical recording</p>
            <p className="mt-1 text-muted-foreground">
              These are original pieces built from rules related to medieval music, not reconstructions of surviving
              works. Mood labels, exact tempos, and the lute-ensemble interpretation are modern creative choices made
              for Lilt.
            </p>
          </div>
          <section>
            <h3 className="font-heading font-semibold">Following medieval conventions</h3>
            <p className="mt-1 text-muted-foreground">
              Each of the {MUSIC_ROOTS.length} atmospheres defines a musical vocabulary: a mode, a metre and tempo
              range, characteristic rhythms, melodic contours, phrase lengths, and open or closed cadences. The modes in
              use are {MODE_SENTENCE}. The forms are: {FORM_SENTENCE}.
            </p>
          </section>
          <section>
            <h3 className="font-heading font-semibold">How a song is built</h3>
            <p className="mt-1 text-muted-foreground">
              A seeded composer chooses the tonic, form, length, and reusable phrase material, then shapes mostly
              stepwise modal melodies toward prepared cadences. A lead lute adds occasional modal chords without
              overlapping its own score events. Every piece adds a second lute whose independent rhythm line uses mostly
              dyads and triads beneath the lead, and synthesized courses keep ringing naturally beneath following
              attacks. <span className="text-foreground">New song</span> writes new phrase material;
              <span className="text-foreground">Variation</span> keeps the underlying material but changes its
              treatment;
              <span className="text-foreground">Performance</span> changes only subtle timing, duration, and dynamics.
              The same settings and seed always rebuild the same piece, and no remote generative-AI service is involved.
            </p>
          </section>
          <section>
            <h3 className="font-heading font-semibold">What you hear</h3>
            <p className="mt-1 text-muted-foreground">
              Every course is synthesized locally as a plucked pair of gut strings. Chords tightly strum two or three
              courses from low to high. The string model feeds its excitation through a short lossy delay—the
              Karplus–Strong family of algorithms—then adds plucking-position colour, slight course detuning, and body
              resonances. Atmospheres choose among {LUTE_STYLE_SENTENCE}. No recordings or generative-AI service are
              used, and live playback uses the same renderer for every saved take.
            </p>
          </section>
          <section>
            <h3 className="font-heading font-semibold">Covers, and the rest of your machine</h3>
            <p className="mt-1 text-muted-foreground">
              Every song draws its own cover: a rose window whose petals count the metre, whose centre stands for the
              form, and whose turn follows the tonic, drawn in Lilt’s signature colours. With system controls on, the
              song and its cover appear wherever this computer lists what is playing, and the play, pause, and
              next-track keys reach the score. Next song is a control in here too, since Lilt otherwise decides when a
              piece has run its course.
            </p>
          </section>
          <section>
            <h3 className="font-heading font-semibold">Keep or download a piece</h3>
            <p className="mt-1 text-muted-foreground">
              The latest {MAX_MUSIC_HISTORY} songs are remembered automatically on this device. Use the heart to keep up
              to {MAX_MUSIC_FAVORITES} favourites and replay the exact composition, lute body, and performance later.
              Favourites store a compact recipe rather than an audio file and can be lost if local app or site data is
              cleared. Export MIDI for the note data; downloaded files remain yours outside Lilt.
            </p>
          </section>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
