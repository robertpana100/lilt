import { describe, expect, test } from "vitest";
import { generateMusicPiece } from "../composition/generator";
import { getMusicRoot, NO_MUTED_PARTS } from "../composition/roots";
import { DEFAULT_MUSIC_EFFECTS } from "../synthesis/effects/config";
import { MusicStatusReporter, type MusicReporterView } from "./reporter";
import { MusicRuntimePublisher } from "./runtime";
import type { MusicEngineConfig } from "./types";
import { DEFAULT_MUSIC_CHORDS } from "../composition/chord-config";
import { DEFAULT_MUSIC_RHYTHM_LUTE } from "../composition/rhythm-lute-config";

const config: MusicEngineConfig = {
  rootId: "hearth",
  bpm: getMusicRoot("hearth").tempo.default,
  masterSeed: 7,
  pieceIndex: 0,
  variationIndex: 0,
  performanceIndex: 0,
  novelty: 0.5,
  chords: DEFAULT_MUSIC_CHORDS,
  rhythmLute: DEFAULT_MUSIC_RHYTHM_LUTE,
  humanization: 0.55,
  formOverride: null,
  tonicOverride: null,
  autoAdvance: true,
  mutedParts: NO_MUTED_PARTS,
  effects: DEFAULT_MUSIC_EFFECTS,
};

function harness(overrides: Partial<MusicReporterView> = {}) {
  let composed = 0;
  const piece = generateMusicPiece(config);
  const view: MusicReporterView = {
    isEnabled: () => true,
    hasPiece: () => true,
    piece: () => {
      composed += 1;
      return piece;
    },
    pieceName: () => "A test piece",
    config: () => config,
    soundingEffects: () => DEFAULT_MUSIC_EFFECTS,
    ...overrides,
  };
  const runtime = new MusicRuntimePublisher(() => ({ piece: view.piece(), name: view.pieceName(), config }));
  return { reporter: new MusicStatusReporter(runtime, view), runtime, pieceReads: () => composed };
}

describe("MusicStatusReporter", () => {
  test("a disabled boot announces status without composing the opening piece", () => {
    const { reporter, runtime, pieceReads } = harness({ isEnabled: () => false, hasPiece: () => false });
    reporter.announcePiece("stopped");
    reporter.renderingChanged();
    expect(runtime.peek()).toBeNull();
    expect(pieceReads()).toBe(0);
    expect(runtime.get().status).toBe("stopped");
  });

  test("a finished repertoire is announced once", () => {
    const { reporter, runtime } = harness();
    let notified = 0;
    runtime.subscribe(() => {
      notified += 1;
    });
    reporter.announcePiece("playing");
    reporter.complete();
    const after = notified;
    reporter.complete();
    expect(runtime.get().status).toBe("complete");
    expect(notified).toBe(after);
  });

  test("a rendering change preserves the current piece and playback status", () => {
    const { reporter, runtime } = harness();
    reporter.announcePiece("playing");
    const before = runtime.get();
    reporter.renderingChanged();
    expect(runtime.get().status).toBe(before.status);
    expect(runtime.get().piece).toBe(before.piece);
  });
});
