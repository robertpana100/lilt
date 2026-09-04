import { LUTE_TECHNIQUE_NAMES, type MusicLuteLineupEntry } from "@/audio/composition/lineup";
import { getLuteStyle, MUSIC_PART_LABELS } from "@/audio/composition/roots";
import { Badge } from "@/components/ui/badge";

export function LuteLineup({ lineup }: { lineup: readonly MusicLuteLineupEntry[] }) {
  if (lineup.length === 0) return null;
  const groups = [
    { role: "Lead lute", entries: lineup.filter((entry) => entry.part !== "rhythm") },
    { role: "Rhythm lute", entries: lineup.filter((entry) => entry.part === "rhythm") },
  ].filter((group) => group.entries.length > 0);
  return (
    <div>
      <p className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">Ensemble</p>
      <div className="mt-1 space-y-2">
        {groups.map((group) => {
          const firstEntry = group.entries[0];
          if (!firstEntry) return null;
          return (
            <div key={group.role}>
              <p className="text-xs">
                <span className="font-medium">{group.role}</span>
                <span className="text-muted-foreground"> · {getLuteStyle(firstEntry.style).name}</span>
              </p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {group.entries.map((entry) => (
                  <li key={entry.part}>
                    <Badge variant="outline" className="font-normal">
                      <span className="text-muted-foreground">{MUSIC_PART_LABELS[entry.part]}</span>
                      <span aria-hidden className="mx-1 text-muted-foreground/50">
                        ·
                      </span>
                      {LUTE_TECHNIQUE_NAMES[entry.technique]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
