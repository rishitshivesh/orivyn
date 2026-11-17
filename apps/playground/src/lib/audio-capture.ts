/** Microphone audio is captured only after an explicit user gesture. */
export async function recordCommand(
  onReady: (stop: () => void) => void,
  durationMs = 20_000,
): Promise<{ samples: Float32Array; sampleRate: 16000 }> {
  if (
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    throw new Error(
      "Microphone recording is unavailable or requires HTTPS/localhost",
    );
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks: BlobPart[] = [];
  let decoding: AudioContext | undefined;
  try {
    const recorder = new MediaRecorder(stream);
    const blob = await new Promise<Blob>((resolve, reject) => {
      const timer = window.setTimeout(
        () => {
          if (recorder.state === "recording") recorder.stop();
        },
        Math.min(20_000, Math.max(1000, durationMs)),
      );
      const stop = () => {
        if (recorder.state === "recording") recorder.stop();
      };
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        clearTimeout(timer);
        reject(new Error("Microphone recorder failed"));
      };
      recorder.onstop = () => {
        clearTimeout(timer);
        resolve(new Blob(chunks, { type: recorder.mimeType }));
      };
      recorder.start();
      onReady(stop);
    });
    if (!blob.size) throw new Error("No microphone audio was captured");
    // Hardware/microphone sample rates vary. Whistle requires 16kHz mono Float32.
    decoding = new AudioContext();
    const decoded = await decoding.decodeAudioData(await blob.arrayBuffer());
    const frames = Math.ceil(decoded.duration * 16000);
    if (frames < 1600 || frames > 20 * 16000 + 16000) {
      throw new Error("Record between 0.1 and 20 seconds of speech");
    }
    const offline = new OfflineAudioContext(1, frames, 16000);
    const input = offline.createBuffer(1, decoded.length, decoded.sampleRate);
    const mono = input.getChannelData(0);
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const pcm = decoded.getChannelData(channel);
      for (let i = 0; i < mono.length; i++)
        mono[i] += pcm[i] / decoded.numberOfChannels;
    }
    const source = offline.createBufferSource();
    source.buffer = input;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return { samples: rendered.getChannelData(0).slice(), sampleRate: 16000 };
  } finally {
    stream.getTracks().forEach((track) => { track.stop(); });
    if (decoding) await decoding.close();
  }
}
