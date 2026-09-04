import type { CoverArtBand, CoverArtDesign, CoverArtDevice } from "./design";

const COVER_ART_SIZE = 512;

/**
 * Draws the design as a rota: an outer ring, a treated band, a rose of petals
 * inside it, and a filled hub with the form's device knocked out.
 *
 * A cover is read at the size of a Control Center tile or a taskbar thumbnail,
 * so the drawing stays deliberately coarse and everything stays inside the
 * rings. Fine detail, or anything loose near the frame, is mud at forty pixels.
 */
export function drawCoverArt(context: CanvasRenderingContext2D, design: CoverArtDesign, size = COVER_ART_SIZE): void {
  const outerRadius = size * 0.35;
  const innerRadius = outerRadius * 0.78;
  const ring = size * design.ringWeight;

  context.save();
  context.fillStyle = design.field;
  context.fillRect(0, 0, size, size);

  context.strokeStyle = design.ink;
  context.fillStyle = design.ink;
  context.lineCap = "butt";
  context.lineJoin = "round";

  // A frame, so the tile reads as an object rather than as a coloured square.
  context.lineWidth = size * 0.02;
  const inset = size * 0.055;
  context.strokeRect(inset, inset, size - inset * 2, size - inset * 2);

  context.translate(size / 2, size / 2);
  context.rotate((design.rotationDegrees * Math.PI) / 180);

  drawRose(context, design.symmetry, innerRadius, ring);
  drawBand(context, design.band, design.symmetry, innerRadius, outerRadius, ring);

  context.lineWidth = ring;
  for (const radius of [outerRadius, innerRadius]) {
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();
  }

  // The tonic turns the window, not its device: a form should be recognisable
  // from its device without first working out how far the piece rotated it.
  context.rotate((-design.rotationDegrees * Math.PI) / 180);
  drawHub(context, design, innerRadius);
  context.restore();
}

/**
 * Petals tangent to the inner ring, drawn heavily enough to survive being scaled
 * down and lightly enough that their crossings stay visible as crossings.
 */
function drawRose(context: CanvasRenderingContext2D, symmetry: number, innerRadius: number, ring: number): void {
  const petal = innerRadius / 2;
  context.lineWidth = ring * 0.7;
  context.globalAlpha = 0.7;
  for (let index = 0; index < symmetry; index += 1) {
    const angle = (index / symmetry) * Math.PI * 2;
    context.beginPath();
    context.arc(Math.cos(angle) * petal, Math.sin(angle) * petal, petal, 0, Math.PI * 2);
    context.stroke();
  }
  context.globalAlpha = 1;
}

/** The band between the rings: left plain, spoked like a wheel, or studded. */
function drawBand(
  context: CanvasRenderingContext2D,
  band: CoverArtBand,
  symmetry: number,
  innerRadius: number,
  outerRadius: number,
  ring: number,
): void {
  if (band === "plain") return;
  const middle = (innerRadius + outerRadius) / 2;
  context.lineWidth = ring * 0.7;
  for (let index = 0; index < symmetry; index += 1) {
    const angle = ((index + 0.5) / symmetry) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    if (band === "spoked") {
      context.beginPath();
      context.moveTo(cos * innerRadius, sin * innerRadius);
      context.lineTo(cos * outerRadius, sin * outerRadius);
      context.stroke();
      continue;
    }
    context.beginPath();
    context.arc(cos * middle, sin * middle, ring * 0.6, 0, Math.PI * 2);
    context.fill();
  }
}

/** The filled centre, with the form's device knocked out of it. */
function drawHub(context: CanvasRenderingContext2D, design: CoverArtDesign, innerRadius: number): void {
  const hub = innerRadius * 0.46;
  context.fillStyle = design.ink;
  context.beginPath();
  context.arc(0, 0, hub, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = design.field;
  context.fillStyle = design.field;
  context.lineWidth = hub * 0.2;
  context.lineCap = "butt";
  drawDevice(context, design.device, hub * 0.62);
}

function drawDevice(context: CanvasRenderingContext2D, device: CoverArtDevice, reach: number): void {
  switch (device) {
    case "cross":
      context.beginPath();
      context.moveTo(0, -reach);
      context.lineTo(0, reach);
      context.moveTo(-reach, 0);
      context.lineTo(reach, 0);
      context.stroke();
      return;
    case "lozenge":
      context.beginPath();
      context.moveTo(0, -reach);
      context.lineTo(reach, 0);
      context.lineTo(0, reach);
      context.lineTo(-reach, 0);
      context.closePath();
      context.fill();
      return;
    case "quatrefoil":
      for (let index = 0; index < 4; index += 1) {
        const angle = (index / 4) * Math.PI * 2;
        context.beginPath();
        context.arc(Math.cos(angle) * reach * 0.5, Math.sin(angle) * reach * 0.5, reach * 0.52, 0, Math.PI * 2);
        context.fill();
      }
      return;
    case "star":
      context.beginPath();
      for (let index = 0; index < 6; index += 1) {
        const angle = (index / 6) * Math.PI * 2;
        context.moveTo(0, 0);
        context.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
      }
      context.stroke();
      return;
    // Repetition drawn as repetition: three bars, unmistakable at any size.
    case "bars":
      for (const offset of [-reach * 0.62, 0, reach * 0.62]) {
        context.fillRect(-reach, offset - reach * 0.19, reach * 2, reach * 0.38);
      }
      return;
    case "spiral":
      context.beginPath();
      for (let step = 0; step <= 48; step += 1) {
        const turn = (step / 48) * Math.PI * 3;
        const distance = (step / 48) * reach;
        const x = Math.cos(turn) * distance;
        const y = Math.sin(turn) * distance;
        if (step === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
  }
}

/**
 * The design as a PNG data URL, or nothing where there is no canvas to draw on.
 * Callers treat a missing cover as "no artwork", which is a surface without a
 * picture rather than a failure.
 */
export function renderCoverArt(design: CoverArtDesign, size = COVER_ART_SIZE): string | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;
  try {
    drawCoverArt(context, design, size);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
