import { useAppearance } from "@/appearance/browser";
import { useEffect, useMemo, useRef, useState } from "react";
import { coverArtDesign, type CoverArtSubject } from "@/audio/cover-art/design";
import { drawCoverArt } from "@/audio/cover-art/render";
import { COVER_COLORS } from "@/appearance/cover-colors";

/**
 * The current device pixel ratio, updating when the window moves between
 * monitors of different density. The matching media query only fires when the
 * ratio it was built for stops matching, so the listener re-registers on each
 * change.
 */
function useDevicePixelRatio(): number {
  const [ratio, setRatio] = useState(() => globalThis.devicePixelRatio || 1);
  useEffect(() => {
    const media = globalThis.matchMedia?.(`(resolution: ${ratio}dppx)`);
    if (!media) return;
    const onChange = () => setRatio(globalThis.devicePixelRatio || 1);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [ratio]);
  return ratio;
}

interface MusicCoverArtProps {
  subject: CoverArtSubject;
  /** Drawn size in pixels; the canvas itself is backed at device resolution. */
  size?: number;
  label?: string;
}

/**
 * A take's cover, drawn here rather than fetched.
 *
 * The studio draws directly onto a canvas. The operating system's panel
 * needs an image URL and has its own rendering path.
 */
export function MusicCoverArt({ subject, size = 56, label = "Cover art" }: MusicCoverArtProps) {
  const { resolved } = useAppearance();
  const colors = COVER_COLORS[resolved];
  const { rootId, form, tonicMidi, compositionSeed, variationSeed } = subject;
  // The sounding snapshot is republished on every scheduler tick, and a fresh
  // object each time. Holding the design by what it is drawn from, rather than
  // by the object it came in, keeps a tick that changed nothing from repainting.
  const design = useMemo(
    () => coverArtDesign({ rootId, form, tonicMidi, compositionSeed, variationSeed }, colors),
    [rootId, form, tonicMidi, compositionSeed, variationSeed, colors],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const devicePixelRatio = useDevicePixelRatio();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(3, Math.max(1, devicePixelRatio));
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    drawCoverArt(context, design, size);
  }, [design, size, devicePixelRatio]);

  return (
    <canvas ref={canvasRef} role="img" aria-label={label} style={{ width: size, height: size }} className="cover-art" />
  );
}
