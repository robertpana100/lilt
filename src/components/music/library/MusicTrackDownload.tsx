import { IconDownload } from "@tabler/icons-react";
import { downloadMusicMidi } from "@/audio/musicExport";
import type { MusicLibraryTrack } from "@/audio/musicLibrary";
import { Button } from "@/components/ui/button";
import { notify } from "@/app/notifications/store";

interface MusicTrackDownloadProps {
  entry: MusicLibraryTrack;
}

/** Downloads one saved take as MIDI note data. */
export function MusicTrackDownload({ entry }: MusicTrackDownloadProps) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label={`Export ${entry.name} as MIDI`}
      title={`Export ${entry.name} as MIDI`}
      onClick={() => {
        downloadMusicMidi(entry.piece, entry.name);
        notify("success", `${entry.name} exported as MIDI`);
      }}
    >
      <IconDownload />
    </Button>
  );
}
