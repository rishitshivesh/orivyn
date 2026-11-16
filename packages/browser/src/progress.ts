/** Progress events are emitted only for explicit local model operations. */
export type LocalModelKind = "needle" | "whistle";
export type LocalModelStage =
  | "idle"
  | "download"
  | "initialize"
  | "ready"
  | "infer"
  | "transcribe"
  | "error";
export interface LocalModelProgress {
  model: LocalModelKind;
  stage: LocalModelStage;
  loaded?: number;
  total?: number;
  percentage?: number;
  message?: string;
}
export type ProgressListener = (event: LocalModelProgress) => void;

export function progressLabel(event: LocalModelProgress): string {
  if (event.stage === "download")
    return event.percentage == null
      ? "Downloading model assets…"
      : `Downloading model assets · ${Math.round(event.percentage)}%`;
  return (
    {
      idle: "Not loaded",
      initialize: "Initializing local model…",
      ready: "Ready on this device",
      infer: "Generating tool proposals…",
      transcribe: "Transcribing locally…",
      error: "Model operation failed",
    } as const
  )[event.stage];
}
