import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider, sliderValue } from "@/components/ui/slider";
import { getMusicRoot, MUSIC_FORM_LABELS, type MusicPieceForm } from "@/audio/composition/roots";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { PercentSlider } from "@/components/music/PercentSlider";
import { ControlSection } from "./ControlSection";
import { NumberField, SwitchRow } from "./ControlFields";
import { midiLabel } from "./music-labels";

export function MusicCompositionSection() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const root = getMusicRoot(session.rootId);
  const formItems = [
    { value: "auto", label: "Auto" },
    ...root.forms.map((form) => ({ value: form, label: MUSIC_FORM_LABELS[form] })),
  ];
  const tonicItems = [
    { value: "auto", label: "Auto" },
    ...root.safeTonics.map((tonic) => ({ value: tonic.toString(), label: midiLabel(tonic) })),
  ];
  return (
    <ControlSection id="composition">
      <NumberField label="Master seed" value={session.masterSeed} onChange={(seed) => controller.setMasterSeed(seed)} />
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Label>Tempo</Label>
          <Badge variant="outline">{session.bpm} BPM</Badge>
        </div>
        <Slider
          aria-label="Studio music tempo"
          min={root.tempo.min}
          max={root.tempo.max}
          step={1}
          value={[session.bpm]}
          onValueChange={(value) => controller.setBpm(sliderValue(value))}
        />
        <p className="text-2xs text-muted-foreground">
          Root range: {root.tempo.min}–{root.tempo.max} BPM
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Form lock</Label>
          <Select
            items={formItems}
            value={session.formOverride ?? "auto"}
            onValueChange={(value) => controller.setFormOverride(value === "auto" ? null : (value as MusicPieceForm))}
          >
            <SelectTrigger aria-label="Music form lock" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              {root.forms.map((form) => (
                <SelectItem key={form} value={form}>
                  {MUSIC_FORM_LABELS[form]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tonic lock</Label>
          <Select
            items={tonicItems}
            value={session.tonicOverride?.toString() ?? "auto"}
            onValueChange={(value) => controller.setTonicOverride(value === "auto" ? null : Number(value))}
          >
            <SelectTrigger aria-label="Music tonic lock" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              {root.safeTonics.map((tonic) => (
                <SelectItem key={tonic} value={tonic.toString()}>
                  {midiLabel(tonic)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <PercentSlider
        label="Humanization"
        ariaLabel="Music humanization"
        value={session.humanization}
        onChange={(humanization) => controller.setHumanization(humanization)}
      />
      <SwitchRow
        ariaLabel="Automatic next music piece"
        label={<span className="text-xs font-medium">Automatic repertoire</span>}
        hint="Generate the next piece after a short pause."
        checked={session.autoAdvance}
        onCheckedChange={(enabled) => controller.setAutoAdvance(enabled)}
      />
    </ControlSection>
  );
}
