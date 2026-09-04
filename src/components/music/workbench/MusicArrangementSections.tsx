import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { PercentSlider } from "../PercentSlider";
import { CheckboxField, RangeField } from "./ControlFields";

export function MusicArrangementSections() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  return (
    <div className="instrument-columns">
      <section className="instrument" aria-label="Lead lute">
        <div className="section-heading">
          <CheckboxField
            label="Lead lute"
            ariaLabel="Enable lute strings"
            checked={!session.mutedParts.strings}
            onCheckedChange={(enabled) => controller.setPartMuted("strings", !enabled)}
          />
          <button type="button" className="text-button" onClick={() => controller.resetChords()}>
            Reset harmony
          </button>
        </div>
        {!session.mutedParts.strings && (
          <div className="control-grid">
            <PercentSlider
              label="Chord amount"
              ariaLabel="Music chord amount"
              value={session.chords.amount}
              onChange={(amount) => controller.setChords({ amount })}
            />
            <label className="field">
              Courses
              <select
                aria-label="Music chord maximum courses"
                value={session.chords.maxCourses}
                onChange={(event) => controller.setChords({ maxCourses: event.currentTarget.value === "2" ? 2 : 3 })}
              >
                <option value={2}>2 · Dyads</option>
                <option value={3}>3 · Triads</option>
              </select>
            </label>
            <RangeField
              label="Strum spread"
              ariaLabel="Music chord strum spread"
              value={session.chords.strumMs}
              max={40}
              display={`${session.chords.strumMs} ms`}
              disabled={session.chords.amount === 0}
              onChange={(strumMs) => controller.setChords({ strumMs })}
            />
          </div>
        )}
      </section>
      <section className="instrument" aria-label="Rhythm lute">
        <div className="section-heading">
          <CheckboxField
            label="Rhythm lute"
            ariaLabel="Enable rhythm lute"
            checked={!session.mutedParts.rhythm}
            onCheckedChange={(enabled) => controller.setPartMuted("rhythm", !enabled)}
          />
          <button type="button" className="text-button" onClick={() => controller.resetRhythmLute()}>
            Reset rhythm lute
          </button>
        </div>
        {!session.mutedParts.rhythm && (
          <div className="control-grid">
            <PercentSlider
              label="Density"
              ariaLabel="Music rhythm lute chord density"
              value={session.rhythmLute.density}
              onChange={(density) => controller.setRhythmLute({ density })}
            />
            <PercentSlider
              label="Level"
              ariaLabel="Music rhythm lute level"
              value={session.rhythmLute.level}
              onChange={(level) => controller.setRhythmLute({ level })}
            />
            <label className="field">
              Courses
              <select
                aria-label="Music rhythm lute maximum courses"
                value={session.rhythmLute.maxCourses}
                onChange={(event) =>
                  controller.setRhythmLute({ maxCourses: event.currentTarget.value === "2" ? 2 : 3 })
                }
              >
                <option value={2}>2 · Dyads</option>
                <option value={3}>3 · Triads</option>
              </select>
            </label>
            <RangeField
              label="Strum spread"
              ariaLabel="Music rhythm lute strum spread"
              value={session.rhythmLute.strumMs}
              max={40}
              display={`${session.rhythmLute.strumMs} ms`}
              onChange={(strumMs) => controller.setRhythmLute({ strumMs })}
            />
          </div>
        )}
      </section>
    </div>
  );
}
