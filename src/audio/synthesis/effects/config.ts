import { booleanField, clampedNumber, partialObject } from "../../valueGuards";

export interface ChorusEffectConfig {
  enabled: boolean;
  mix: number;
  rateHz: number;
  depthMs: number;
}

export interface EchoEffectConfig {
  enabled: boolean;
  mix: number;
  delaySeconds: number;
  feedback: number;
}

export interface ReverbEffectConfig {
  enabled: boolean;
  mix: number;
  decaySeconds: number;
}

export interface ToneEffectConfig {
  enabled: boolean;
  lowGainDb: number;
  highGainDb: number;
}

export interface TremoloEffectConfig {
  enabled: boolean;
  depth: number;
  rateHz: number;
}

export interface SaturationEffectConfig {
  enabled: boolean;
  mix: number;
  drive: number;
}

export interface MusicEffectsConfig {
  bypassed: boolean;
  chorus: ChorusEffectConfig;
  echo: EchoEffectConfig;
  reverb: ReverbEffectConfig;
  tone: ToneEffectConfig;
  tremolo: TremoloEffectConfig;
  saturation: SaturationEffectConfig;
}

export type MusicEffectId = Exclude<keyof MusicEffectsConfig, "bypassed">;

export const DEFAULT_MUSIC_EFFECTS: Readonly<MusicEffectsConfig> = Object.freeze({
  bypassed: false,
  chorus: Object.freeze({ enabled: true, mix: 0.12, rateHz: 0.7, depthMs: 3.5 }),
  echo: Object.freeze({ enabled: true, mix: 0.05, delaySeconds: 0.18, feedback: 0.06 }),
  reverb: Object.freeze({ enabled: true, mix: 0.1, decaySeconds: 1.15 }),
  tone: Object.freeze({ enabled: true, lowGainDb: 0, highGainDb: 2.5 }),
  tremolo: Object.freeze({ enabled: true, depth: 0.18, rateHz: 4.2 }),
  saturation: Object.freeze({ enabled: true, mix: 0.08, drive: 0.16 }),
});

/** The echo stays a short burst under the melody, never a wash: its time is
 * capped at 0.2 s and its mix and feedback at a tenth of their former reach. */
export const ECHO_LIMITS = Object.freeze({ maxMix: 0.06, maxDelaySeconds: 0.2, maxFeedback: 0.075 });

/** Strict bounded config for session updates. */
export function normalizeMusicEffects(value: unknown): MusicEffectsConfig {
  const candidate = partialObject<MusicEffectsConfig>(value);
  const chorus = partialObject<ChorusEffectConfig>(candidate.chorus);
  const echo = partialObject<EchoEffectConfig>(candidate.echo);
  const reverb = partialObject<ReverbEffectConfig>(candidate.reverb);
  const tone = partialObject<ToneEffectConfig>(candidate.tone);
  const tremolo = partialObject<TremoloEffectConfig>(candidate.tremolo);
  const saturation = partialObject<SaturationEffectConfig>(candidate.saturation);
  return {
    bypassed: booleanField(candidate.bypassed, DEFAULT_MUSIC_EFFECTS.bypassed),
    chorus: {
      enabled: booleanField(chorus.enabled, DEFAULT_MUSIC_EFFECTS.chorus.enabled),
      mix: clampedNumber(chorus.mix, DEFAULT_MUSIC_EFFECTS.chorus.mix, 0, 0.6),
      rateHz: clampedNumber(chorus.rateHz, DEFAULT_MUSIC_EFFECTS.chorus.rateHz, 0.05, 3),
      depthMs: clampedNumber(chorus.depthMs, DEFAULT_MUSIC_EFFECTS.chorus.depthMs, 0, 12),
    },
    echo: {
      enabled: booleanField(echo.enabled, DEFAULT_MUSIC_EFFECTS.echo.enabled),
      mix: clampedNumber(echo.mix, DEFAULT_MUSIC_EFFECTS.echo.mix, 0, ECHO_LIMITS.maxMix),
      delaySeconds: clampedNumber(
        echo.delaySeconds,
        DEFAULT_MUSIC_EFFECTS.echo.delaySeconds,
        0.06,
        ECHO_LIMITS.maxDelaySeconds,
      ),
      feedback: clampedNumber(echo.feedback, DEFAULT_MUSIC_EFFECTS.echo.feedback, 0, ECHO_LIMITS.maxFeedback),
    },
    reverb: {
      enabled: booleanField(reverb.enabled, DEFAULT_MUSIC_EFFECTS.reverb.enabled),
      mix: clampedNumber(reverb.mix, DEFAULT_MUSIC_EFFECTS.reverb.mix, 0, 0.5),
      decaySeconds: clampedNumber(reverb.decaySeconds, DEFAULT_MUSIC_EFFECTS.reverb.decaySeconds, 0.2, 3),
    },
    tone: {
      enabled: booleanField(tone.enabled, DEFAULT_MUSIC_EFFECTS.tone.enabled),
      lowGainDb: clampedNumber(tone.lowGainDb, DEFAULT_MUSIC_EFFECTS.tone.lowGainDb, -12, 12),
      highGainDb: clampedNumber(tone.highGainDb, DEFAULT_MUSIC_EFFECTS.tone.highGainDb, -12, 12),
    },
    tremolo: {
      enabled: booleanField(tremolo.enabled, DEFAULT_MUSIC_EFFECTS.tremolo.enabled),
      depth: clampedNumber(tremolo.depth, DEFAULT_MUSIC_EFFECTS.tremolo.depth, 0, 1),
      rateHz: clampedNumber(tremolo.rateHz, DEFAULT_MUSIC_EFFECTS.tremolo.rateHz, 0.2, 12),
    },
    saturation: {
      enabled: booleanField(saturation.enabled, DEFAULT_MUSIC_EFFECTS.saturation.enabled),
      mix: clampedNumber(saturation.mix, DEFAULT_MUSIC_EFFECTS.saturation.mix, 0, 0.6),
      drive: clampedNumber(saturation.drive, DEFAULT_MUSIC_EFFECTS.saturation.drive, 0, 1),
    },
  };
}

export function cloneMusicEffects(effects: Readonly<MusicEffectsConfig>): MusicEffectsConfig {
  return {
    bypassed: effects.bypassed,
    chorus: { ...effects.chorus },
    echo: { ...effects.echo },
    reverb: { ...effects.reverb },
    tone: { ...effects.tone },
    tremolo: { ...effects.tremolo },
    saturation: { ...effects.saturation },
  };
}
