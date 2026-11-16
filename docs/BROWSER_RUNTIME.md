# Browser runtime: Needle + Whistle

## Delivery status

Orivyn's first local runtime adapter uses the independently maintained Apache-2.0 `cactus-needle` package. It exposes Needle tool proposals and Whistle speech recognition in browser WebAssembly workers.

Source:
- `packages/browser/src/cactus-runtime.ts`: lazy model sessions and local proposals.
- `packages/browser/src/validate.ts`: tool allowlist, JSON Schema validation and read-only boundary.
- `apps/playground/src/hooks/use-local-runtime.ts`: React lifecycle around one runtime.
- `apps/playground/src/lib/audio-capture.ts`: microphone capture, audio decode and track cleanup.
- `apps/playground/src/components/console/local-voice.tsx`: opt-in microphone UI.
- `apps/playground/src/app/playground/page.tsx`: execution target selection.

## Next.js worker and WASM asset handling

The `cactus-needle` package resolves its default worker and WASM using `import.meta.url`. Next.js may not rewrite these dependency URLs into HTTP asset URLs, which can cause `Failed to construct 'URL': Invalid URL`.

Orivyn now runs `apps/playground/scripts/sync-cactus-assets.mjs` before `next dev` and `next build`. This copies the **exact installed npm package's** `cactus-needle/browser/worker.js` and `cactus-needle/browser/needle.wasm` assets into `apps/playground/public/vendor/cactus/`. The Orivyn adapter passes the resulting **same-origin** `workerUrl` and `wasmUrl` explicitly to both Needle and Whistle. No manual download of the runtime binary is required.

For third-party consumers, use `new CactusBrowserRuntime({ workerUrl: "/your-worker.js", wasmUrl: "/your-needle.wasm" })` when asset paths differ. The host application must expose both URLs. Do not import a worker/wasm from an unstable, deep `node_modules` relative URL.

You can inspect the assets after starting the app:
```bash
curl -I http://localhost:3000/vendor/cactus/worker.js
curl -I http://localhost:3000/vendor/cactus/needle.wasm
```
Both requests should return HTTP 200. These assets are build outputs, not committed files. The Dockerfile copies `public/` into the standalone runtime image.

## How to try

1. `pnpm install`, then `pnpm dev:web`. The local mode does not require the FastAPI backend or API keys.
2. Visit `http://localhost:3000/playground`; select **Local browser**.
3. Choose one or both read-only example tools, enter a concrete prompt and click **Generate proposals**.
4. First use downloads Needle weights (approximately 35 MB), the worker and WASM; the runtime retains a session while the Playground is mounted. CacheStorage persists verified assets where allowed.
5. Inspect the returned proposals. They are validated locally but **never executed** by the Playground.
6. To use voice, click **Speak locally**, allow microphone access, speak a short English command, then click **Stop recording** (or let the 20-second cap stop automatically). Whistle weights (approximately 17 MB) load on first speech use, then decoded PCM is transcribed locally. Review the transcript before generating a proposal.

## Execution and privacy

- Local mode does not send the instruction, recording, transcript or model result to Orivyn API.
- Browser model weights, WASM and workers may be downloaded from the package's configured external model hosts on first load. This is an asset download, not a remote inference request.
- Microphone permission is requested only when the user clicks the voice button. Tracks are stopped before transcription.
- No automatic remote fallback. Changing to **Backend API** explicitly changes the transport; backend requests require a Playground token.
- Read-only browser tools only. Anything with server execution or write/sensitive risk is rejected.
- Tool proposals are checked against registered JSON Schemas using AJV. This does not replace consumer-side access policy.
- Keep Cactus/Needle session instances out of server-side rendering and never expose API credentials in client bundles.

## Limitations

- This is a browser integration requiring actual Chromium, Firefox and Safari validation. The package documents Chromium as tested; Orivyn provides the worker/WASM copies and explicit URLs, but real browser validation is still required.
- WebAssembly workers require a secure context (HTTPS or localhost). Some browsers may block storage or downloads; initial inference may be slow on low-power devices.
- Whistle's documented supported languages are en, de, fr, es, it, nl and pl. This is not a Hindi transcription solution.
- This version records up to 20 seconds using MediaRecorder with manual stop and browser audio decoding; it does not provide streaming speech, input-level visualization or silence detection.
- Model calls can consume significant RAM/CPU. They are lazy-loaded but do not yet surface detailed RAM/timing telemetry.
- Tool schema validation is performed, but no UI action execution is provided.
- A lifecycle/race under rapid unmount or cancellation still requires browser QA.
- Do not claim complete integration until `pnpm install`, `pnpm typecheck`, a real Next.js production build, and browser-based WASM inference and voice tests pass.

## Model credits and dependencies

- `cactus-needle`: community-maintained JavaScript/TypeScript WebAssembly adapter, Apache-2.0.
- Needle and Whistle: Cactus Compute weights/runtime. Respect applicable licenses, model notices, and integrity guarantees on redistribution.
- `ajv`: validation of model-proposed JSON arguments.
- `@orivyn/browser`: Orivyn stable wrapper; consumer apps use this rather than depending directly on the third-party runtime.

## Next hardening iteration

1. Run actual inference in Chromium with configured Next.js production worker/WASM asset paths.
2. Implement clear model download progress and cancellation.
3. Add live input levels and voice activity detection.
4. Verify mobile browsers and low-memory execution; add adjustable session retention limits.
5. Add tests for schema validation, unavailable environments, cleanup and abort.
6. Ship app-owned typed action executor with explicit policy review.
