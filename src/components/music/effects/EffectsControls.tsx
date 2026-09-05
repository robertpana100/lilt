import { Button } from "@/components/ui/Button";
import * as stylex from "@stylexjs/stylex";
import { styles } from "./styles";
import { ECHO_LIMITS } from "@/audio/synthesis/effects/config";
import { useMusicRuntime, useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { PercentSlider } from "@/components/music/PercentSlider";
import { Switch } from "@/components/ui/Switch";
import { EffectBlock, EffectSlider } from "./EffectControls";

export function EffectsControls() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const sounding = useMusicRuntime().soundingEffects;
  const bypassed = session.effects.bypassed;
  return (
    <section aria-label="Effects controls">
      <div {...stylex.props(styles.heading)}>
        <Switch
          label="Effects enabled"
          checked={!bypassed}
          onCheckedChange={(enabled) => controller.setEffectsBypassed(!enabled)}
        />
        <Button variant="quiet" onClick={() => controller.resetEffects()}>
          Reset effects
        </Button>
      </div>
      <EffectBlock
        name="Tone"
        enabled={sounding.tone.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("tone", { enabled })}
      >
        <EffectSlider
          label="Bass"
          value={session.effects.tone.lowGainDb}
          minimum={-12}
          maximum={12}
          step={0.5}
          unit="dB"
          onChange={(lowGainDb) => controller.setEffect("tone", { lowGainDb })}
        />
        <EffectSlider
          label="Treble"
          value={session.effects.tone.highGainDb}
          minimum={-12}
          maximum={12}
          step={0.5}
          unit="dB"
          onChange={(highGainDb) => controller.setEffect("tone", { highGainDb })}
        />
      </EffectBlock>
      <EffectBlock
        name="Saturation"
        enabled={sounding.saturation.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("saturation", { enabled })}
      >
        <PercentSlider
          label="Mix"
          value={session.effects.saturation.mix}
          onChange={(mix) => controller.setEffect("saturation", { mix })}
        />
        <PercentSlider
          label="Drive"
          value={session.effects.saturation.drive}
          onChange={(drive) => controller.setEffect("saturation", { drive })}
        />
      </EffectBlock>
      <EffectBlock
        name="Chorus"
        enabled={sounding.chorus.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("chorus", { enabled })}
      >
        <PercentSlider
          label="Mix"
          value={session.effects.chorus.mix}
          onChange={(mix) => controller.setEffect("chorus", { mix })}
        />
        <EffectSlider
          label="Rate"
          value={session.effects.chorus.rateHz}
          minimum={0.05}
          maximum={3}
          step={0.05}
          unit="Hz"
          onChange={(rateHz) => controller.setEffect("chorus", { rateHz })}
        />
        <EffectSlider
          label="Depth"
          value={session.effects.chorus.depthMs}
          minimum={0}
          maximum={12}
          step={0.25}
          unit="ms"
          onChange={(depthMs) => controller.setEffect("chorus", { depthMs })}
        />
      </EffectBlock>
      <EffectBlock
        name="Tremolo"
        enabled={sounding.tremolo.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("tremolo", { enabled })}
      >
        <PercentSlider
          label="Depth"
          value={session.effects.tremolo.depth}
          onChange={(depth) => controller.setEffect("tremolo", { depth })}
        />
        <EffectSlider
          label="Rate"
          value={session.effects.tremolo.rateHz}
          minimum={0.2}
          maximum={12}
          step={0.1}
          unit="Hz"
          onChange={(rateHz) => controller.setEffect("tremolo", { rateHz })}
        />
      </EffectBlock>
      <EffectBlock
        name="Echo"
        enabled={sounding.echo.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("echo", { enabled })}
      >
        <PercentSlider
          label="Mix"
          maximum={ECHO_LIMITS.maxMix}
          value={session.effects.echo.mix}
          onChange={(mix) => controller.setEffect("echo", { mix })}
        />
        <EffectSlider
          label="Time"
          value={session.effects.echo.delaySeconds}
          minimum={0.06}
          maximum={ECHO_LIMITS.maxDelaySeconds}
          step={0.01}
          unit="s"
          onChange={(delaySeconds) => controller.setEffect("echo", { delaySeconds })}
        />
        <PercentSlider
          label="Repeats"
          maximum={ECHO_LIMITS.maxFeedback}
          value={session.effects.echo.feedback}
          onChange={(feedback) => controller.setEffect("echo", { feedback })}
        />
      </EffectBlock>
      <EffectBlock
        name="Reverb"
        enabled={sounding.reverb.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("reverb", { enabled })}
      >
        <PercentSlider
          label="Mix"
          value={session.effects.reverb.mix}
          onChange={(mix) => controller.setEffect("reverb", { mix })}
        />
        <EffectSlider
          label="Decay"
          value={session.effects.reverb.decaySeconds}
          minimum={0.2}
          maximum={3}
          step={0.05}
          unit="s"
          onChange={(decaySeconds) => controller.setEffect("reverb", { decaySeconds })}
        />
      </EffectBlock>
    </section>
  );
}
