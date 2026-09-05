import * as stylex from "@stylexjs/stylex";
import { Disclosure } from "@/components/ui/Disclosure";
import { EffectsControls } from "../effects/EffectsControls";
import { StyleControls } from "./StyleControls";
import { MelodyControls } from "./MelodyControls";
import { AccompanimentControls } from "./AccompanimentControls";
import { PlaybackControls } from "./PlaybackControls";
import { styles } from "./styles";

export function MusicControls() {
  return (
    <section aria-label="Music settings" {...stylex.props(styles.root)}>
      <StyleControls />
      <Disclosure title="Melody" description="Shape, variation, and harmony">
        <MelodyControls />
      </Disclosure>
      <Disclosure title="Accompaniment" description="The second lute supporting the melody">
        <AccompanimentControls />
      </Disclosure>
      <Disclosure title="Effects" description="Tone, texture, and space">
        <EffectsControls />
      </Disclosure>
      <Disclosure title="Playback" description="Continuous listening and playing feel">
        <PlaybackControls />
      </Disclosure>
    </section>
  );
}
