import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { PercentSlider } from "@/components/music/PercentSlider";
import { ControlSection } from "./ControlSection";
import { SwitchRow } from "./ControlFields";
import { AuditionPanel } from "./AuditionPanel";
import { MusicEffectSlider } from "./MusicEffectControls";

export function MusicArrangementSections() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  return (
    <>
      <ControlSection id="voices">
        <SwitchRow
          ariaLabel="Enable lute strings"
          label={<span className="text-xs font-medium">Strings</span>}
          hint="Mute or hear the lute's melodic string voice independently."
          checked={!session.mutedParts.strings}
          onCheckedChange={(enabled) => controller.setPartMuted("strings", !enabled)}
        />
        <SwitchRow
          ariaLabel="Enable rhythm lute"
          label={<span className="text-xs font-medium">Rhythm lute</span>}
          hint="Mute or hear the second lute's chord accompaniment independently."
          checked={!session.mutedParts.rhythm}
          onCheckedChange={(enabled) => controller.setPartMuted("rhythm", !enabled)}
        />
      </ControlSection>
      <ControlSection id="audition">
        <AuditionPanel />
      </ControlSection>
      <ControlSection
        id="harmony"
        aside={
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => controller.resetChords()}>
            Reset harmony
          </Button>
        }
      >
        <PercentSlider
          label="Chord amount"
          ariaLabel="Music chord amount"
          value={session.chords.amount}
          onChange={(amount) => controller.setChords({ amount })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Maximum courses</Label>
            <Select
              items={[
                { value: "2", label: "2 · Dyads" },
                { value: "3", label: "3 · Triads" },
              ]}
              value={session.chords.maxCourses.toString()}
              onValueChange={(value) => controller.setChords({ maxCourses: value === "2" ? 2 : 3 })}
            >
              <SelectTrigger aria-label="Music chord maximum courses" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 · Dyads</SelectItem>
                <SelectItem value="3">3 · Triads</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <MusicEffectSlider
            label="Strum spread"
            ariaLabel="Music chord strum spread"
            value={session.chords.strumMs}
            minimum={0}
            maximum={40}
            step={1}
            unit="ms"
            disabled={session.chords.amount === 0}
            onChange={(strumMs) => controller.setChords({ strumMs })}
          />
        </div>
        <p className="text-2xs leading-4 text-muted-foreground">
          Zero amount removes chord voicings from the lead. Other settings keep its harmony inside the lead lute's
          non-overlapping string part.
        </p>
      </ControlSection>
      <ControlSection
        id="rhythm-lute"
        aside={
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => controller.resetRhythmLute()}>
            Reset rhythm lute
          </Button>
        }
      >
        <PercentSlider
          label="Chord density"
          ariaLabel="Music rhythm lute chord density"
          value={session.rhythmLute.density}
          onChange={(density) => controller.setRhythmLute({ density })}
        />
        <PercentSlider
          label="Rhythm level"
          ariaLabel="Music rhythm lute level"
          value={session.rhythmLute.level}
          onChange={(level) => controller.setRhythmLute({ level })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Maximum courses</Label>
            <Select
              items={[
                { value: "2", label: "2 · Dyads" },
                { value: "3", label: "3 · Triads" },
              ]}
              value={session.rhythmLute.maxCourses.toString()}
              onValueChange={(value) => controller.setRhythmLute({ maxCourses: value === "2" ? 2 : 3 })}
            >
              <SelectTrigger aria-label="Music rhythm lute maximum courses" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 · Dyads</SelectItem>
                <SelectItem value="3">3 · Triads</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <MusicEffectSlider
            label="Strum spread"
            ariaLabel="Music rhythm lute strum spread"
            value={session.rhythmLute.strumMs}
            minimum={0}
            maximum={40}
            step={1}
            unit="ms"
            onChange={(strumMs) => controller.setRhythmLute({ strumMs })}
          />
        </div>
        <p className="text-2xs leading-4 text-muted-foreground">
          Every piece uses a second lute. It establishes modal harmony with mostly triadic bar-level strums beneath the
          lead; density controls how often it reinforces the pulse.
        </p>
      </ControlSection>
    </>
  );
}
