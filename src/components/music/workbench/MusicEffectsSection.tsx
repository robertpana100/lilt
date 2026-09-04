import { Button } from "@/components/ui/button";
import { ECHO_LIMITS } from "@/audio/synthesis/effects/config";
import { useMusicRuntime, useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { PercentSlider } from "@/components/music/PercentSlider";
import { ControlSection } from "./ControlSection";
import { SwitchRow } from "./ControlFields";
import { MusicEffectBlock, MusicEffectSlider } from "./MusicEffectControls";

export function MusicEffectsSection() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const sounding = useMusicRuntime().soundingEffects;
  const bypassed = session.effects.bypassed;
  return (
    <ControlSection
      id="effects"
      aside={
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => controller.resetEffects()}>
          Reset rack
        </Button>
      }
    >
      <SwitchRow
        ariaLabel="Bypass all music effects"
        label={<span className="text-xs font-medium">Bypass rack</span>}

        checked={bypassed}
        onCheckedChange={(enabled) => controller.setEffectsBypassed(enabled)}
      />
      <MusicEffectBlock
        name="Tone"

        enabled={sounding.tone.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("tone", { enabled })}
      >
        <MusicEffectSlider
          label="Low shelf"
          value={session.effects.tone.lowGainDb}
          minimum={-12}
          maximum={12}
          step={0.5}
          unit="dB"
          disabled={!sounding.tone.enabled || bypassed}
          onChange={(lowGainDb) => controller.setEffect("tone", { lowGainDb })}
        />
        <MusicEffectSlider
          label="High shelf"
          value={session.effects.tone.highGainDb}
          minimum={-12}
          maximum={12}
          step={0.5}
          unit="dB"
          disabled={!sounding.tone.enabled || bypassed}
          onChange={(highGainDb) => controller.setEffect("tone", { highGainDb })}
        />
      </MusicEffectBlock>
      <MusicEffectBlock
        name="Saturation"

        enabled={sounding.saturation.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("saturation", { enabled })}
      >
        <PercentSlider
          label="Mix"
          value={session.effects.saturation.mix}
          disabled={!sounding.saturation.enabled || bypassed}
          onChange={(mix) => controller.setEffect("saturation", { mix })}
        />
        <PercentSlider
          label="Drive"
          value={session.effects.saturation.drive}
          disabled={!sounding.saturation.enabled || bypassed}
          onChange={(drive) => controller.setEffect("saturation", { drive })}
        />
      </MusicEffectBlock>
      <MusicEffectBlock
        name="Chorus"

        enabled={sounding.chorus.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("chorus", { enabled })}
      >
        <PercentSlider
          label="Mix"
          value={session.effects.chorus.mix}
          disabled={!sounding.chorus.enabled || bypassed}
          onChange={(mix) => controller.setEffect("chorus", { mix })}
        />
        <MusicEffectSlider
          label="Rate"
          value={session.effects.chorus.rateHz}
          minimum={0.05}
          maximum={3}
          step={0.05}
          unit="Hz"
          disabled={!sounding.chorus.enabled || bypassed}
          onChange={(rateHz) => controller.setEffect("chorus", { rateHz })}
        />
        <MusicEffectSlider
          label="Depth"
          value={session.effects.chorus.depthMs}
          minimum={0}
          maximum={12}
          step={0.25}
          unit="ms"
          disabled={!sounding.chorus.enabled || bypassed}
          onChange={(depthMs) => controller.setEffect("chorus", { depthMs })}
        />
      </MusicEffectBlock>
      <MusicEffectBlock
        name="Tremolo"

        enabled={sounding.tremolo.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("tremolo", { enabled })}
      >
        <PercentSlider
          label="Depth"
          value={session.effects.tremolo.depth}
          disabled={!sounding.tremolo.enabled || bypassed}
          onChange={(depth) => controller.setEffect("tremolo", { depth })}
        />
        <MusicEffectSlider
          label="Rate"
          value={session.effects.tremolo.rateHz}
          minimum={0.2}
          maximum={12}
          step={0.1}
          unit="Hz"
          disabled={!sounding.tremolo.enabled || bypassed}
          onChange={(rateHz) => controller.setEffect("tremolo", { rateHz })}
        />
      </MusicEffectBlock>
      <MusicEffectBlock
        name="Echo"

        enabled={sounding.echo.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("echo", { enabled })}
      >
        <PercentSlider
          label="Mix"
          maximum={ECHO_LIMITS.maxMix}
          value={session.effects.echo.mix}
          disabled={!sounding.echo.enabled || bypassed}
          onChange={(mix) => controller.setEffect("echo", { mix })}
        />
        <MusicEffectSlider
          label="Time"
          value={session.effects.echo.delaySeconds}
          minimum={0.06}
          maximum={ECHO_LIMITS.maxDelaySeconds}
          step={0.01}
          unit="s"
          disabled={!sounding.echo.enabled || bypassed}
          onChange={(delaySeconds) => controller.setEffect("echo", { delaySeconds })}
        />
        <PercentSlider
          label="Feedback"
          maximum={ECHO_LIMITS.maxFeedback}
          value={session.effects.echo.feedback}
          disabled={!sounding.echo.enabled || bypassed}
          onChange={(feedback) => controller.setEffect("echo", { feedback })}
        />
      </MusicEffectBlock>
      <MusicEffectBlock
        name="Reverb"

        enabled={sounding.reverb.enabled}
        bypassed={bypassed}
        onEnabledChange={(enabled) => controller.setEffect("reverb", { enabled })}
      >
        <PercentSlider
          label="Mix"
          value={session.effects.reverb.mix}
          disabled={!sounding.reverb.enabled || bypassed}
          onChange={(mix) => controller.setEffect("reverb", { mix })}
        />
        <MusicEffectSlider
          label="Decay"
          value={session.effects.reverb.decaySeconds}
          minimum={0.2}
          maximum={3}
          step={0.05}
          unit="s"
          disabled={!sounding.reverb.enabled || bypassed}
          onChange={(decaySeconds) => controller.setEffect("reverb", { decaySeconds })}
        />
      </MusicEffectBlock>
    </ControlSection>
  );
}
