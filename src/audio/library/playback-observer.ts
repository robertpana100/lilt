import type { MusicRuntimeSnapshot } from "../playback/types";
import { recordMusicPiecePlayed } from "./store";

/** The playback-port slice that history recording needs to observe. */
export interface ObservableMusicPlayback {
  subscribeRuntime(listener: () => void): () => void;
  peekRuntimeSnapshot(): MusicRuntimeSnapshot | null;
  isAudible(): boolean;
}

/**
 * The library's own record-keeping: it watches the runtime the engine
 * publishes instead of being called from inside the engine. A piece is
 * recorded when the engine announces it as sounding (the piece-start nonce
 * moved and the status agrees) and the context is genuinely producing sound,
 * so a suspended or autoplay-blocked engine cannot log pieces that never
 * played.
 */
export function recordAudiblePieces(playback: ObservableMusicPlayback): () => void {
  // Peeked, never forced: a publish on a music-disabled boot (a stop before
  // anything played) has no materialized snapshot, and reading one here would
  // compose the opening piece just to ignore it. A sounding piece always
  // publishes a full piece snapshot, so a peek can never miss a piece start.
  let lastNonce: number | null = null;
  return playback.subscribeRuntime(() => {
    const snapshot = playback.peekRuntimeSnapshot();
    if (snapshot === null) return;
    if (snapshot.pieceStartNonce === lastNonce) return;
    lastNonce = snapshot.pieceStartNonce;
    if (snapshot.status !== "playing") return;
    if (!playback.isAudible()) return;
    recordMusicPiecePlayed(snapshot.piece, snapshot.recipe, snapshot.name);
  });
}
