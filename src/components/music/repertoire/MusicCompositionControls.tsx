import { IconRefresh } from "@tabler/icons-react";
import { MUSIC_ROOTS, type MusicRoot } from "@/audio/composition/roots";
import { useMusicSessionController, type MusicSessionState } from "@/audio/playback/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider, sliderValue } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { PercentSlider } from "../PercentSlider";

const MUSIC_ROOT_ITEMS = MUSIC_ROOTS.map((entry) => ({
  value: entry.id,
  label: `${entry.name} · ${entry.theme}`,
}));

interface MusicCompositionControlsProps {
  config: MusicSessionState;
  root: MusicRoot;
  locked: boolean;
}

/** The vocabulary each song is written from, and how freely it is written. */
export function MusicCompositionControls({ config, root, locked }: MusicCompositionControlsProps) {
  const controller = useMusicSessionController();
  const rerolls = [
    { label: "New song", onClick: () => controller.newComposition(), variant: "default" },
    { label: "Variation", onClick: () => controller.newVariation(), variant: "outline" },
    { label: "Performance", onClick: () => controller.newPerformance(), variant: "outline" },
  ] as const;
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium">Atmosphere</p>
          <Badge variant="secondary">{root.mode}</Badge>
        </div>
        <Select
          items={MUSIC_ROOT_ITEMS}
          disabled={locked}
          value={config.rootId}
          onValueChange={(value) => {
            if (value) controller.setRoot(value as (typeof MUSIC_ROOTS)[number]["id"]);
          }}
        >
          <SelectTrigger aria-label="Music theme" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MUSIC_ROOTS.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.name} · {entry.theme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-2xs leading-5 text-muted-foreground">{root.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <Label>Tempo</Label>
            <Badge variant="outline">{config.bpm} BPM</Badge>
          </div>
          <Slider
            aria-label="Music tempo"
            min={root.tempo.min}
            max={root.tempo.max}
            step={1}
            value={[config.bpm]}
            disabled={locked}
            onValueChange={(value) => controller.setBpm(sliderValue(value))}
          />
        </div>
        <PercentSlider
          label="Variety"
          value={config.novelty}
          disabled={locked}
          onChange={(novelty) => controller.setNovelty(novelty)}
        />
      </div>

      <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <div>
          <p className="text-xs font-medium">Endless repertoire</p>
          <p className="text-2xs text-muted-foreground">Begin another named song after a short pause.</p>
        </div>
        <Switch
          aria-label="Endless music repertoire"
          checked={config.autoAdvance}
          disabled={locked}
          onCheckedChange={(enabled) => controller.setAutoAdvance(enabled)}
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {rerolls.map(({ label, onClick, variant }) => (
          <Button
            key={label}
            size="sm"
            variant={variant}
            disabled={locked}
            className="h-auto min-h-9 px-2 text-xs whitespace-normal"
            onClick={onClick}
          >
            <IconRefresh />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
