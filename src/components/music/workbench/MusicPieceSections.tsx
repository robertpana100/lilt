import { IconDice5, IconRefresh } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMusicRoot, MUSIC_ROOTS } from "@/audio/composition/roots";
import { useMusicRuntime, useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { LuteLineup } from "@/components/music/LuteLineup";
import { PercentSlider } from "@/components/music/PercentSlider";
import { durationLabel } from "@/components/music/format";
import { ControlSection } from "./ControlSection";
import { MusicPlaybackSection } from "./MusicPlaybackSection";
import { midiLabel } from "./music-labels";

const MUSIC_ROOT_SELECT_ITEMS = MUSIC_ROOTS.map((root) => ({ value: root.id, label: `${root.name} · ${root.theme}` }));

export function MusicPieceSections() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const runtime = useMusicRuntime();
  const root = getMusicRoot(session.rootId);
  return (
    <>
      <div className="score-column">
        <ControlSection
          id="root"
          aside={
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => controller.randomize()}>
              <IconDice5 />
              Random root
            </Button>
          }
        >
          <Select
            items={MUSIC_ROOT_SELECT_ITEMS}
            value={session.rootId}
            onValueChange={(value) => value && controller.setRoot(value as (typeof MUSIC_ROOTS)[number]["id"])}
          >
            <SelectTrigger aria-label="Music root" className="h-9 w-full">
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
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge>{root.theme}</Badge>
              <Badge variant="outline">{root.mode}</Badge>
              <Badge variant="outline">{root.meter}</Badge>
              <Badge variant="outline">{runtime.status}</Badge>
            </div>
          </div>
        </ControlSection>

        <MusicPlaybackSection />
      </div>
      <ControlSection id="now-playing">
        <p className="text-xs text-muted-foreground">
          Piece {runtime.pieceIndex + 1} · section {runtime.sectionId ?? "—"} · {durationLabel(runtime.durationSeconds)}
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-xs sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Form</p>
            <p className="font-medium">{runtime.form}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tonic</p>
            <p className="font-medium">{midiLabel(runtime.tonicMidi)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Composition</p>
            <p className="truncate font-mono">{runtime.compositionSeed}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Next pause</p>
            <p className="font-medium">{runtime.gapSeconds.toFixed(1)}s</p>
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <LuteLineup lineup={runtime.lineup} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            size="sm"
            className="h-auto min-h-9 whitespace-normal px-2 text-xs"
            onClick={() => controller.newComposition()}
          >
            <IconRefresh />
            New composition
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-auto min-h-9 whitespace-normal px-2 text-xs"
            onClick={() => controller.newVariation()}
          >
            <IconRefresh />
            New variation
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-auto min-h-9 whitespace-normal px-2 text-xs"
            onClick={() => controller.newPerformance()}
          >
            <IconRefresh />
            New performance
          </Button>
        </div>
        <PercentSlider
          label="Novelty"
          ariaLabel="Music novelty"
          value={session.novelty}
          onChange={(novelty) => controller.setNovelty(novelty)}
        />
      </ControlSection>
    </>
  );
}
