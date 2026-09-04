import { coverArtDesign, type CoverArtSubject, type CoverArtColors } from "./design";
import { renderCoverArt } from "./render";

export { coverArtDesign, type CoverArtDesign, type CoverArtSubject } from "./design";
export { drawCoverArt } from "./render";

interface CoverArt {
  /** Identity of the drawing, so a caller can tell one cover from another. */
  key: string;
  url: string | null;
}

// One take's cover at a time. Pieces last minutes and the snapshot moves every
// tick, so the cache exists to keep a scheduler tick from redrawing a canvas,
// not to hold a gallery.
let cached: CoverArt | null = null;

/**
 * A cover as an image file, drawn once per take and per theme.
 *
 * Surfaces that can draw for themselves, such as the studio, hand a design to a
 * canvas of their own instead. This exists for the operating system, which
 * takes the encoded image URL.
 */
export function coverArtImage(subject: CoverArtSubject, colors: CoverArtColors): CoverArt {
  const design = coverArtDesign(subject, colors);
  if (cached?.key === design.key) return cached;
  const url = renderCoverArt(design);
  cached = { key: design.key, url };
  return cached;
}
