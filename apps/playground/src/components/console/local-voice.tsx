"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordCommand } from "@/lib/audio-capture";

export function LocalVoice({
  transcribe,
  onTranscript,
  disabled,
}: {
  transcribe: (audio: {
    samples: Float32Array;
    sampleRate: number;
  }) => Promise<string>;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const stopRef = useRef<(() => void) | null>(null);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  async function capture() {
    setRecording(true);
    setMessage("Recording locally. Stop when finished or after 20 seconds.");
    try {
      const audio = await recordCommand((stop) => {
        stopRef.current = stop;
      });
      stopRef.current = null;
      setRecording(false);
      setProcessing(true);
      setMessage("Transcribing locally with Whistle…");
      const text = await transcribe(audio);
      if (!text.trim())
        throw new Error("No speech recognized; try a shorter, clearer command");
      onTranscript(text);
      setMessage("Transcript ready. Review before running.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Voice input failed");
    } finally {
      stopRef.current = null;
      setRecording(false);
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-2">
      {recording ? (
        <Button variant="outline" onClick={() => stopRef.current?.()}>
          <MicOff className="size-4" /> Stop recording
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={disabled || processing}
          onClick={() => void capture()}
        >
          <Mic className="size-4" />{" "}
          {processing ? "Transcribing…" : "Speak locally"}
        </Button>
      )}
      <p aria-live="polite" className="text-xs text-slate-500">
        {message ||
          "Whistle audio inference stays on this device. Model weights download on first use."}
      </p>
    </div>
  );
}
