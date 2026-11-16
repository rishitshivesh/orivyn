/**
 * Explicit microphone capture. Records at most twenty seconds, decodes to mono
 * Float32 PCM, then releases microphone tracks before model inference.
 */
export async function recordCommand(
  onReady: (stop: () => void) => void,
  durationMs = 20_000,
): Promise<{ samples: Float32Array; sampleRate: number }> {
  if (
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    throw new Error("Microphone recording is unavailable in this browser");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks: BlobPart[] = [];
  let context: AudioContext | undefined;
  try {
    const recorder = new MediaRecorder(stream);
    const blob = await new Promise<Blob>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, durationMs);
      const stop = () => {
        if (recorder.state === "recording") recorder.stop();
      };
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("Unable to record microphone input"));
      };
      recorder.onstop = () => {
        window.clearTimeout(timer);
        resolve(new Blob(chunks, { type: recorder.mimeType }));
      };
      recorder.start();
      onReady(stop);
    });
    if (!blob.size) throw new Error("No voice audio was captured");
    context = new AudioContext();
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const samples = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const pcm = decoded.getChannelData(channel);
      for (let i = 0; i < samples.length; i++)
        samples[i] += pcm[i] / decoded.numberOfChannels;
    }
    return { samples, sampleRate: decoded.sampleRate };
  } finally {
    stream.getTracks().forEach((track) => track.stop());
    if (context) await context.close();
  }
}
