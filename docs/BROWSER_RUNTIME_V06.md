# v0.6 Browser Runtime Reliability

This increment strengthens **local** Needle and Whistle operation. It does not depend on the FastAPI server, OpenAI, external chat models, Redis or a database.

## Shipped behavior

1. **Lazy initialization with observable progress.** The browser SDK uses the upstream `createNeedle` / `createWhistle` factories to load verified model weights and WASM on the first user-requested operation. An optional `onProgress` callback emits model-specific `initialize`, `download`, `ready`, `infer`, `transcribe` and `error` states.
2. **Bounded work and cancellation.** Each operation takes an optional `AbortSignal`; the default deadline is 120 seconds. Cancellation is exposed by the Console's Playground and benchmark UI. Aborted sessions are not reused.
3. **Session reuse and idle cleanup.** An initialized model is retained between sequential calls. After five minutes without activity, both sessions are closed and the next use lazily reloads the model. Both timeout and idle interval are configurable.
4. **Microphone normalization.** The Console records only after user interaction, captures at most 20 seconds, releases microphone tracks, downsamples and mixes audio to **16 kHz mono Float32 PCM** using browser `OfflineAudioContext`, then passes it to Whistle.
5. **User-visible model lifecycle.** The shared `ModelProgress` shadcn-based component displays actual initialization/download/inference stages, download byte counts when reported, and cancellation. The UI doesn't manufacture a percentage if the runtime doesn't report one.
6. **Repository hygiene.** Generated Turbo cache/logs, IDE state and TypeScript build metadata have been removed from tracked files and are covered by `.gitignore`.

## Public package surface

```ts
import { CactusBrowserRuntime } from "@orivyn/browser";

const runtime = new CactusBrowserRuntime({
  workerUrl: "/vendor/cactus/worker.js",
  wasmUrl: "/vendor/cactus/needle.wasm",
  timeoutMs: 120_000,
  idleTimeoutMs: 300_000,
  onProgress: (event) => console.log(event.model, event.stage, event.percentage),
});

const controller = new AbortController();
const proposal = await runtime.propose(appRequest, controller.signal);
controller.abort(); // May be called while work is active
await runtime.close();
```

Progress events do not indicate inference correctness. Tool validation and host-owned execution remain unchanged and must still be enforced.

## Local verification (required)

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm format
pnpm check
pnpm typecheck
pnpm test
pnpm --filter @orivyn/playground build
pnpm --filter @orivyn/example-consumer build
```

Start the Console with `pnpm dev:web`. Under `/playground`, choose Needle and test a navigation request. Confirm the progress states reflect real model download/initialization and that cancellation returns control to the UI. Press Speak locally, approve the mic, stop recording and verify a transcript from Whistle.

Under `/benchmarks`, run Needle against the golden fixtures and inspect exact tool arguments, timing and rejection diagnostics. Cancel during inference and verify no subsequent cases execute.

Check `/vendor/cactus/worker.js` and `/vendor/cactus/needle.wasm` return HTTP 200. Repeat cold/warm runs to verify model caching and idle cleanup.

### Limitations

- Live browser behavior, actual WASM performance, Safari compatibility, memory utilization, and microphone transcription must be tested locally. This GitHub-only editing environment cannot run the private monorepo with installed dependencies.
- Individual upstream worker cancellation is dependent on the Cactus adapter's handling of `AbortSignal`.
- There is no voice activity detection, wake word, continuous listening or voice synthesis.
- Idle cleanup is a resource-management policy; it is not a reliable measurement of actual heap consumption.
- The benchmark still measures tools, not conversational quality. Hosted chat is not involved in this run.
- `pnpm format` must run before a release; any unexecuted checks are **unverified**, not passed.

## Troubleshooting

If the UI stalls during `initialize`, inspect worker/WASM and model-weight requests in DevTools Network. If it stalls during `infer`, inspect Console errors and available memory. A timeout shows a failure message; try a shorter prompt and a fresh model session. Browser caches may be cleared independently by privacy settings.

Full requirement history is in `AGENTS.md` and `docs/BROWSER_RUNTIME.md`.
