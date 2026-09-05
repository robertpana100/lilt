import * as stylex from "@stylexjs/stylex";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { Switch } from "@/components/ui/Switch";
import { PercentSlider } from "../PercentSlider";
import { styles } from "./styles";

export function PlaybackControls() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  return (
    <div {...stylex.props(styles.grid)}>
      <div>
        <Switch
          label="Keep playing"
          checked={session.autoAdvance}
          onCheckedChange={(value) => controller.setAutoAdvance(value)}
        />
        <p {...stylex.props(styles.hint)}>Generate another track when this one ends.</p>
      </div>
      <PercentSlider
        label="Natural timing"
        value={session.humanization}
        description="Small variations in timing, note length, and touch."
        onChange={(value) => controller.setHumanization(value)}
      />
    </div>
  );
}
