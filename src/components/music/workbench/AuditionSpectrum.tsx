import { useEffect, useRef } from "react";
import { getAuditionAnalyser } from "@/audio/debug/audition";
export function AuditionSpectrum() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const binsRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      const surface = canvas?.getContext("2d");
      if (!canvas || !surface) return;
      surface.clearRect(0, 0, canvas.width, canvas.height);
      const analyser = getAuditionAnalyser();
      if (!analyser) return;
      if (!binsRef.current || binsRef.current.length !== analyser.frequencyBinCount) {
        binsRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      const bins = binsRef.current;
      analyser.getByteFrequencyData(bins);
      surface.fillStyle = getComputedStyle(canvas).color;
      const barCount = 72;
      const barWidth = canvas.width / barCount;
      for (let bar = 0; bar < barCount; bar += 1) {
        // Square curve spends more bars on the low end, where the notes live.
        const bin = Math.min(bins.length - 1, Math.floor((bar / barCount) ** 2 * bins.length * 0.7));
        const value = (bins[bin] ?? 0) / 255;
        const barHeight = Math.max(1, value * (canvas.height - 2));
        surface.globalAlpha = 0.3 + 0.7 * value;
        surface.fillRect(bar * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }
      surface.globalAlpha = 1;
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={64}
      aria-label="Audition frequency spectrum"
      className="h-16 w-full rounded-lg border bg-muted/30 text-primary"
    />
  );
}
