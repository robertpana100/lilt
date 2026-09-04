import { useAppearance } from "@/appearance/browser";
import { useEffect } from "react";
import { getMusicApplication } from "@/audio/application";
import { coverArtImage } from "@/audio/cover-art";
import { getSystemMediaSession } from "@/audio/system-media";
import { COVER_COLORS } from "@/appearance/cover-colors";
export function useSystemMediaArtwork(): void {
  const colors = COVER_COLORS[useAppearance().resolved];
  useEffect(() => {
    const media = getSystemMediaSession();
    if (!media) return;
    const playback = getMusicApplication().playback;
    let published: string | null = null;
    const publish = () => {
      const runtime = playback.peekRuntimeSnapshot();
      if (!runtime) return;
      const cover = coverArtImage(runtime, colors);
      if (published === cover.key) return;
      published = cover.key;
      media.setArtwork(cover.url);
    };
    publish();
    return playback.subscribeRuntime(publish);
  }, [colors]);
}
