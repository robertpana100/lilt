import type { SystemMediaPresence } from "./types";

const PRESENCE_SAMPLE_RATE = 8000;
const PRESENCE_SECONDS = 1;

/**
 * A one-second mono WAV alternating between the two quietest sample values.
 *
 * It carries a real audio track, which is what Chromium requires before it will
 * treat a page as something the operating system can show and control, and at one
 * unit of a 16-bit sample (about -90 dBFS) it is inaudible next to the score it
 * accompanies. Silence exactly at zero is a track a browser is free to treat as
 * no audio at all, so the alternation is deliberate.
 */
export function nearSilentWave(sampleRate = PRESENCE_SAMPLE_RATE, seconds = PRESENCE_SECONDS): ArrayBuffer {
  const frames = Math.max(1, Math.round(sampleRate * seconds));
  const HEADER_BYTES = 44;
  const buffer = new ArrayBuffer(HEADER_BYTES + frames * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  text(0, "RIFF");
  view.setUint32(4, buffer.byteLength - 8, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  view.setUint32(40, frames * 2, true);
  for (let frame = 0; frame < frames; frame += 1) {
    view.setInt16(HEADER_BYTES + frame * 2, frame % 2 === 0 ? 1 : -1, true);
  }
  return buffer;
}

/**
 * Keeps the near-silent element playing for as long as the score is sounding.
 *
 * Playing it needs the same user gesture the score itself needed, so a rejected
 * play is not an error: presence is claimed again on the next sounding piece,
 * by which point the audio context has been unlocked.
 */
export function createSystemMediaPresence(
  options: {
    createElement?: () => HTMLAudioElement;
    createSourceUrl?: () => string;
    revokeSourceUrl?: (url: string) => void;
  } = {},
): SystemMediaPresence {
  const createElement = options.createElement ?? (() => new Audio());
  const createSourceUrl =
    options.createSourceUrl ?? (() => URL.createObjectURL(new Blob([nearSilentWave()], { type: "audio/wav" })));
  const revokeSourceUrl = options.revokeSourceUrl ?? ((url: string) => URL.revokeObjectURL(url));

  let element: HTMLAudioElement | null = null;
  let sourceUrl: string | null = null;

  const ensureElement = (): HTMLAudioElement => {
    if (element) return element;
    sourceUrl = createSourceUrl();
    element = createElement();
    element.src = sourceUrl;
    element.loop = true;
    element.preload = "auto";
    return element;
  };

  return {
    claim() {
      const audio = ensureElement();
      if (!audio.paused) return;
      void Promise.resolve(audio.play()).catch(() => {
        // Autoplay is still locked; the next sounding piece tries again.
      });
    },
    release() {
      element?.pause();
    },
    dispose() {
      element?.pause();
      if (element) element.src = "";
      element = null;
      if (sourceUrl) revokeSourceUrl(sourceUrl);
      sourceUrl = null;
    },
  };
}
