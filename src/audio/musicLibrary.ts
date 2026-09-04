export {
  getMusicHistory,
  getMusicLibrary,
  MAX_MUSIC_FAVORITES,
  MAX_MUSIC_HISTORY,
  MUSIC_LIBRARY_STORAGE_KEY,
  recordMusicPiecePlayed,
  reloadMusicLibraryForTests,
  resetMusicLibraryForTests,
  subscribeMusicLibrary,
  toggleMusicFavorite,
} from "./library/store";
export { composedLibraryPiece } from "./library/normalization";
export { searchMusicTracks } from "./library/search";
export { useMusicLibrary } from "./library/react";
export type { MusicFavoriteEntry, MusicHistoryEntry, MusicLibrarySnapshot, MusicLibraryTrack } from "./library/types";
