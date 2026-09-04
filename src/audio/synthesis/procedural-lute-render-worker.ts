import { ProceduralLuteRenderPool } from "./procedural-lute";
import { isProceduralLuteWorkerRequest, type ProceduralLuteWorkerResponse } from "./procedural-lute-worklet-contract";

declare const self: {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: ProceduralLuteWorkerResponse, transfer: Transferable[]): void;
};

const renderer = new ProceduralLuteRenderPool();

self.onmessage = (event) => {
  if (!isProceduralLuteWorkerRequest(event.data)) return;
  const { id, request } = event.data;
  try {
    const pooled = renderer.renderCourse(request.options);
    const samples = pooled.slice().buffer;
    self.postMessage({ id, samples }, [samples]);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : "Procedural rendering failed." }, []);
  }
};
