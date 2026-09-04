import { pickMusicValue } from "../composition/random";
import { MUSIC_ROOTS, getMusicRoot, type MusicRootId } from "../composition/roots";
import type { MusicSettings } from "../musicSettings";
import type { MusicEngineConfig } from "./types";

/**
 * Chooses what plays automatically. Every root is repertoire: each piece simply moves somewhere else, and over a
 * session the whole set is heard.
 */

/**
 * Picks a root at random. Pass the root now playing to leave it out, so a new
 * piece is audibly a new piece rather than more of the same.
 */
export function nextMusicRoot(current: MusicRootId | null, pick: () => number = Math.random): MusicRootId {
  const choices = MUSIC_ROOTS.filter((root) => root.id !== current);
  return pickMusicValue(choices, () => Math.min(0.999_999, Math.max(0, pick()))).id;
}

/**
 * Moves a configuration to another root. Tempo takes the new root's default,
 * and the settings that only meant something against the old one are dropped: a
 * form and a tonic come from a root's own vocabulary.
 */
export function withMusicRoot(config: MusicEngineConfig, rootId: MusicRootId): MusicEngineConfig {
  return {
    ...config,
    rootId,
    bpm: getMusicRoot(rootId).tempo.default,
    formOverride: null,
    tonicOverride: null,
  };
}

/**
 * The configuration the next generated piece is composed from. Only automatic
 * playback wanders: a player who has taken control keeps the root they chose.
 */
export function directNextMusicPiece(
  config: MusicEngineConfig,
  controlMode: MusicSettings["controlMode"],
  pick: () => number = Math.random,
): MusicEngineConfig {
  if (controlMode !== "auto") return config;
  return withMusicRoot(config, nextMusicRoot(config.rootId, pick));
}
