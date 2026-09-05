import { expect, test } from "@playwright/test";

interface AudioProbe {
  analysers: AnalyserNode[];
  worklets: number;
  renders: number;
}

declare global {
  interface Window {
    audioProbe: AudioProbe;
  }
}

test("plays worker-rendered audio, pauses, and resumes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const probe: AudioProbe = { analysers: [], worklets: 0, renders: 0 };
    window.audioProbe = probe;

    // Tap the real output graph without replacing audio processing or scheduling.
    const createCompressor = AudioContext.prototype.createDynamicsCompressor;
    AudioContext.prototype.createDynamicsCompressor = function () {
      const compressor = createCompressor.call(this);
      const analyser = this.createAnalyser();
      compressor.connect(analyser);
      probe.analysers.push(analyser);
      return compressor;
    };
    const NativeWorklet = AudioWorkletNode;
    window.AudioWorkletNode = class extends NativeWorklet {
      constructor(context: BaseAudioContext, name: string, options?: AudioWorkletNodeOptions) {
        super(context, name, options);
        probe.worklets += 1;
      }
    };
    const NativeWorker = Worker;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener("message", ({ data }) => {
          if (data?.samples instanceof ArrayBuffer) probe.renders += 1;
        });
      }
    };
  });

  const outputPeak = () =>
    page.evaluate(() =>
      Math.max(
        0,
        ...window.audioProbe.analysers.map((analyser) => {
          if (analyser.context.state !== "running") return 0;
          const samples = new Float32Array(analyser.fftSize);
          analyser.getFloatTimeDomainData(samples);
          return Math.max(...samples.map(Math.abs));
        }),
      ),
    );

  await page.goto("/");
  const play = page.getByRole("button", { name: "Play music", exact: true });
  const pause = page.getByRole("button", { name: "Pause music", exact: true });
  await expect(play).toBeVisible();
  expect(await outputPeak()).toBe(0);

  await play.click();
  await expect(pause).toBeVisible();
  await expect.poll(outputPeak).toBeGreaterThan(0.001);
  const activity = await page.evaluate(() => ({
    worklets: window.audioProbe.worklets,
    renders: window.audioProbe.renders,
  }));
  expect(activity.worklets).toBeGreaterThan(0);
  expect(activity.renders).toBeGreaterThan(0);

  await pause.click();
  await expect(play).toBeVisible();
  await expect.poll(outputPeak).toBeLessThan(0.001);
  await play.click();
  await expect(pause).toBeVisible();
  await expect.poll(outputPeak).toBeGreaterThan(0.001);
  expect(errors).toEqual([]);
});
