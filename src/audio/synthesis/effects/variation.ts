import { mixMusicSeed, createMusicRandom } from "../../composition/random";
import { normalizeMusicEffects, type MusicEffectsConfig } from "./config";

/** Keeps the variation stream independent from performance humanization. */
const EFFECTS_VARIATION_SALT = 0x46584152;

/** How likely each module is to join a generated performance. Voicing and
 * room carry nearly every take; the colouring modules come and go. */
const ENABLE_CHANCES = {
  tone: 0.9,
  reverb: 0.85,
  saturation: 0.55,
  chorus: 0.5,
  echo: 0.35,
  tremolo: 0.25,
} as const satisfies Record<Exclude<keyof MusicEffectsConfig, "bypassed">, number>;

/**
 * How far a generated performance may push each rack parameter away from the
 * session's setting. Only amounts vary; the rack bypass stays the listener's
 * decision. Reverb is the exception: a performance only ever opens the room
 * up further, never dries it out.
 */
const VARIATION_BANDS = {
  chorus: { mix: 0.08, rateHz: 0.25, depthMs: 1.5 },
  echo: { mix: 0.02, delaySeconds: 0.03, feedback: 0.015 },
  reverb: { mixUp: 0.06, mixSpan: 0.12, decayUp: 0.25, decaySpan: 0.55 },
  tone: { lowGainDb: 1.5, highGainDb: 1.5 },
  tremolo: { depth: 0.06, rateHz: 1.2 },
  saturation: { mix: 0.05, drive: 0.08 },
} as const;

type MusicEffectsSwitches = { [Effect in Exclude<keyof MusicEffectsConfig, "bypassed">]: boolean };

/**
 * How a varied rack chooses its switches. A fresh take flips the weighted
 * coin ("coin"); an edit to a take already sounding keeps the listener's
 * switches verbatim ("listener"), so flipping a toggle is audible
 * immediately and lasts until the next piece.
 */
export interface MusicRackSelection {
  switches: "coin" | "listener";
}

/**
 * Each module joins the take by a seeded coin, weighted by ENABLE_CHANCES.
 * A performance never runs the whole rack at once, and never runs bone dry:
 * if every coin lands on, the echo steps out, and if none does, the room
 * stays.
 */
function pickSwitches(random: () => number): MusicEffectsSwitches {
  const switches = {
    chorus: random() < ENABLE_CHANCES.chorus,
    echo: random() < ENABLE_CHANCES.echo,
    reverb: random() < ENABLE_CHANCES.reverb,
    tone: random() < ENABLE_CHANCES.tone,
    tremolo: random() < ENABLE_CHANCES.tremolo,
    saturation: random() < ENABLE_CHANCES.saturation,
  };
  if (Object.values(switches).every(Boolean)) switches.echo = false;
  if (Object.values(switches).every((enabled) => !enabled)) switches.reverb = true;
  return switches;
}

/**
 * The session's effect settings recast as one performance's pedalboard: which
 * modules join the take is chosen from a stream seeded by the piece's
 * performance seed, each parameter drifts up to its band, and the room opens
 * further than the listener set it, then the whole config is clamped back
 * inside its legal ranges. The same performance seed always produces the
 * same variation, and the base config is never mutated — saved settings and
 * session settings keep what the user set.
 */
export function varyMusicEffects(
  base: Readonly<MusicEffectsConfig>,
  performanceSeed: number,
  selection: MusicRackSelection = { switches: "coin" },
): MusicEffectsConfig {
  const random = createMusicRandom(mixMusicSeed(performanceSeed, EFFECTS_VARIATION_SALT));
  const switches =
    selection.switches === "listener"
      ? {
          chorus: base.chorus.enabled,
          echo: base.echo.enabled,
          reverb: base.reverb.enabled,
          tone: base.tone.enabled,
          tremolo: base.tremolo.enabled,
          saturation: base.saturation.enabled,
        }
      : pickSwitches(random);
  const jitter = (amount: number) => (random() * 2 - 1) * amount;
  return normalizeMusicEffects({
    bypassed: base.bypassed,
    chorus: {
      enabled: switches.chorus,
      mix: base.chorus.mix + jitter(VARIATION_BANDS.chorus.mix),
      rateHz: base.chorus.rateHz + jitter(VARIATION_BANDS.chorus.rateHz),
      depthMs: base.chorus.depthMs + jitter(VARIATION_BANDS.chorus.depthMs),
    },
    echo: {
      enabled: switches.echo,
      mix: base.echo.mix + jitter(VARIATION_BANDS.echo.mix),
      delaySeconds: base.echo.delaySeconds + jitter(VARIATION_BANDS.echo.delaySeconds),
      feedback: base.echo.feedback + jitter(VARIATION_BANDS.echo.feedback),
    },
    reverb: {
      enabled: switches.reverb,
      mix: base.reverb.mix + VARIATION_BANDS.reverb.mixUp + random() * VARIATION_BANDS.reverb.mixSpan,
      decaySeconds:
        base.reverb.decaySeconds + VARIATION_BANDS.reverb.decayUp + random() * VARIATION_BANDS.reverb.decaySpan,
    },
    tone: {
      enabled: switches.tone,
      lowGainDb: base.tone.lowGainDb + jitter(VARIATION_BANDS.tone.lowGainDb),
      highGainDb: base.tone.highGainDb + jitter(VARIATION_BANDS.tone.highGainDb),
    },
    tremolo: {
      enabled: switches.tremolo,
      depth: base.tremolo.depth + jitter(VARIATION_BANDS.tremolo.depth),
      rateHz: base.tremolo.rateHz + jitter(VARIATION_BANDS.tremolo.rateHz),
    },
    saturation: {
      enabled: switches.saturation,
      mix: base.saturation.mix + jitter(VARIATION_BANDS.saturation.mix),
      drive: base.saturation.drive + jitter(VARIATION_BANDS.saturation.drive),
    },
  });
}
