import {
  cloneMusicChords,
  DEFAULT_MUSIC_CHORDS,
  normalizeMusicChords,
  type MusicChordConfig,
} from "../composition/chord-config";
import {
  cloneMusicRhythmLute,
  DEFAULT_MUSIC_RHYTHM_LUTE,
  normalizeMusicRhythmLute,
  type MusicRhythmLuteConfig,
} from "../composition/rhythm-lute-config";
import {
  NO_MUTED_PARTS,
  getMusicRoot,
  type MusicPart,
  type MusicPieceForm,
  type MusicRootId,
} from "../composition/roots";
import {
  cloneMusicEffects,
  DEFAULT_MUSIC_EFFECTS,
  normalizeMusicEffects,
  type MusicEffectId,
  type MusicEffectsConfig,
} from "../synthesis/effects/config";
import { nextMusicRoot } from "./direction";
import type { MusicEngineConfig } from "./types";

export type MusicSessionState = MusicEngineConfig;

export interface InitialMusicSessionOptions {
  pick?: () => number;
  randomSeed?: () => number;
}

export type MusicSessionAction =
  | { type: "set-root"; rootId: MusicRootId }
  | { type: "set-bpm"; bpm: number; pieceIndex: number }
  | { type: "set-master-seed"; masterSeed: number }
  | { type: "new-variation"; pieceIndex: number }
  | { type: "new-performance"; pieceIndex: number }
  | { type: "randomize"; rootId: MusicRootId; masterSeed: number }
  | { type: "set-novelty"; novelty: number; pieceIndex: number }
  | { type: "set-chords"; patch: Partial<MusicChordConfig>; pieceIndex: number }
  | { type: "reset-chords"; pieceIndex: number }
  | { type: "set-rhythm-lute"; patch: Partial<MusicRhythmLuteConfig>; pieceIndex: number }
  | { type: "reset-rhythm-lute"; pieceIndex: number }
  | { type: "set-humanization"; humanization: number }
  | { type: "set-form-override"; formOverride: MusicPieceForm | null; pieceIndex: number }
  | { type: "set-tonic-override"; tonicOverride: number | null; pieceIndex: number }
  | { type: "set-auto-advance"; autoAdvance: boolean }
  | { type: "set-part-muted"; part: MusicPart; muted: boolean }
  | { type: "set-effects-bypassed"; bypassed: boolean }
  | { type: "reset-effects" };

export function createBrowserRandomSeed(): number {
  const values = new Uint32Array(1);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(values);
    return values[0] ?? 0;
  }
  return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}

export function createInitialMusicSessionState(options: InitialMusicSessionOptions = {}): MusicSessionState {
  const pick = options.pick ?? Math.random;
  const rootId = nextMusicRoot(null, pick);
  const root = getMusicRoot(rootId);
  return {
    rootId,
    bpm: root.tempo.default,
    masterSeed: (options.randomSeed ?? createBrowserRandomSeed)(),
    pieceIndex: 0,
    variationIndex: 0,
    performanceIndex: 0,
    novelty: 0.5,
    chords: cloneMusicChords(DEFAULT_MUSIC_CHORDS),
    rhythmLute: cloneMusicRhythmLute(DEFAULT_MUSIC_RHYTHM_LUTE),
    humanization: 0.55,
    formOverride: null,
    tonicOverride: null,
    autoAdvance: true,
    mutedParts: { ...NO_MUTED_PARTS },
    effects: cloneMusicEffects(DEFAULT_MUSIC_EFFECTS),
  };
}

export function cloneMusicSessionState(state: MusicSessionState): MusicSessionState {
  return {
    ...state,
    mutedParts: { ...state.mutedParts },
    chords: cloneMusicChords(state.chords),
    rhythmLute: cloneMusicRhythmLute(state.rhythmLute),
    effects: cloneMusicEffects(state.effects),
  };
}

/** Pure state transition for every ordinary editable session action. */
export function reduceMusicSessionState(state: MusicSessionState, action: MusicSessionAction): MusicSessionState {
  switch (action.type) {
    case "set-root": {
      const root = getMusicRoot(action.rootId);
      return {
        ...state,
        rootId: action.rootId,
        bpm: root.tempo.default,
        pieceIndex: 0,
        variationIndex: 0,
        performanceIndex: 0,
        formOverride: null,
        tonicOverride: null,
      };
    }
    case "set-bpm": {
      const root = getMusicRoot(state.rootId);
      return {
        ...state,
        pieceIndex: action.pieceIndex,
        bpm: Math.round(Math.min(root.tempo.max, Math.max(root.tempo.min, action.bpm))),
      };
    }
    case "set-master-seed":
      return {
        ...state,
        masterSeed: Math.max(0, Math.floor(action.masterSeed)) >>> 0,
        pieceIndex: 0,
        variationIndex: 0,
        performanceIndex: 0,
      };
    case "new-variation":
      return { ...state, pieceIndex: action.pieceIndex, variationIndex: state.variationIndex + 1 };
    case "new-performance":
      return { ...state, pieceIndex: action.pieceIndex, performanceIndex: state.performanceIndex + 1 };
    case "randomize": {
      const root = getMusicRoot(action.rootId);
      return {
        ...state,
        rootId: action.rootId,
        bpm: root.tempo.default,
        masterSeed: action.masterSeed,
        pieceIndex: 0,
        variationIndex: 0,
        performanceIndex: 0,
        formOverride: null,
        tonicOverride: null,
      };
    }
    case "set-novelty":
      return {
        ...state,
        pieceIndex: action.pieceIndex,
        novelty: Math.min(1, Math.max(0, action.novelty)),
      };
    case "set-chords":
      return {
        ...state,
        pieceIndex: action.pieceIndex,
        chords: normalizeMusicChords({ ...state.chords, ...action.patch }),
      };
    case "reset-chords":
      return { ...state, pieceIndex: action.pieceIndex, chords: cloneMusicChords(DEFAULT_MUSIC_CHORDS) };
    case "set-rhythm-lute":
      return {
        ...state,
        pieceIndex: action.pieceIndex,
        rhythmLute: normalizeMusicRhythmLute({ ...state.rhythmLute, ...action.patch }),
      };
    case "reset-rhythm-lute":
      return { ...state, pieceIndex: action.pieceIndex, rhythmLute: cloneMusicRhythmLute(DEFAULT_MUSIC_RHYTHM_LUTE) };
    case "set-humanization":
      return { ...state, humanization: Math.min(1, Math.max(0, action.humanization)) };
    case "set-form-override": {
      const root = getMusicRoot(state.rootId);
      return {
        ...state,
        pieceIndex: action.pieceIndex,
        formOverride:
          action.formOverride !== null && root.forms.includes(action.formOverride) ? action.formOverride : null,
      };
    }
    case "set-tonic-override": {
      const root = getMusicRoot(state.rootId);
      const validTonic =
        action.tonicOverride !== null && root.safeTonics.includes(action.tonicOverride) ? action.tonicOverride : null;
      return { ...state, pieceIndex: action.pieceIndex, tonicOverride: validTonic };
    }
    case "set-auto-advance":
      return { ...state, autoAdvance: action.autoAdvance };
    case "set-part-muted":
      return { ...state, mutedParts: { ...state.mutedParts, [action.part]: action.muted } };
    case "set-effects-bypassed":
      return { ...state, effects: { ...cloneMusicEffects(state.effects), bypassed: action.bypassed } };
    case "reset-effects":
      return { ...state, effects: cloneMusicEffects(DEFAULT_MUSIC_EFFECTS) };
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}

export function updateMusicSessionEffect<Id extends MusicEffectId>(
  state: MusicSessionState,
  effect: Id,
  patch: Partial<MusicEffectsConfig[Id]>,
): MusicSessionState {
  const effects = cloneMusicEffects(state.effects);
  effects[effect] = { ...effects[effect], ...patch } as MusicEffectsConfig[Id];
  return { ...state, effects: normalizeMusicEffects(effects) };
}
