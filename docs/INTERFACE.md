# Orivyn Console

## Current capabilities

The Playground has three deliberately distinct input routes:

| Route | How it works | Accuracy and scope |
| --- | --- | --- |
| Reliable actions | Deterministic parsing of a limited known command grammar | Fast, predictable for supported demo intents; not general natural-language understanding |
| Needle | Browser WebAssembly inference with explicit tool schemas | Local, private, subject to small-model accuracy limitations |
| Backend | FastAPI tool-proposal API with optional Cactus provider | Requires service credentials and provider configuration |

Neither inference route is a conversational reasoning model. No route performs privileged operations.

## Screens

- `/`: platform status, architecture and packages.
- `/playground`: command input, runtime selection, microphone transcription, tool allowlist, reviewable proposals, and **real demo actions**.
- `/tools`: tool definitions and JSON Schema. These are demo-level definitions, not a persistent registry.
- `/runtimes`: runtime boundaries and configured server provider.
- `/guide`: documentation and Scalar OpenAPI links.

## Demo action architecture

The Playground is an isolated frontend demo, **not a link into a real user's Portfolio OS**.

- `src/lib/demo-domain.ts`: typed pages, filters, example projects, tool definitions, deterministic supported-intent parser.
- `src/lib/demo-execution.ts`: allowlisted reducer that validates every proposed argument against a JSON Schema before applying UI state changes.
- `src/components/console/demo-preview.tsx`: visible application surface updated by accepted actions.
- `src/app/playground/page.tsx`: input, user approval, runtime comparison and result inspection.
- `src/lib/capabilities.ts`: shared UI metadata; example tool definitions are imported rather than duplicated.

Only registered read-only browser handlers are executable. Every proposed call is a request, not authorization. The user explicitly clicks **Apply to demo** before the state changes. Backend requests remain proposals and never trigger privileged actions automatically.

The deterministic matcher handles page navigation, infrastructure/technology filtering, and resetting. Other intents are reported unsupported, not fabricated. It doesn't turn Needle into an open-ended conversational LLM.

## Known limitations

- Demo preview content is illustrative and unrelated to the actual Portfolio CMS.
- Persistent app registration, data-bound action manifests, generic SDK action execution, and E.D.I.T.H. retrieval/reasoning are future milestones.
- Browser model loading and the model's tool-call accuracy require runtime evaluation. For unsupported input, the model can produce no eligible call.
- Loader screens are deferred per product preference.

## Developer commands

```bash
pnpm install
pnpm dev:web
pnpm check
pnpm typecheck
pnpm test
```

Server testing additionally requires the FastAPI configuration documented in `docs/DEPLOYMENT.md`.

## Release verification

Run the full dependency-backed quality gate, check the local app in a real browser, exercise all example commands in each mode, inspect WASM/worker downloads and permission handling, and only then treat the interface as production-ready.

## Agent Lab (v0.3)

`/agent` introduces a separate intelligence interface. It does not replace the low-level Playground.

- Known command syntax is routed locally using the existing demo action matcher with a conservative command-vs-question guard. Actions are offered for review and applied to the visible demo only after clicking **Apply to demo**.
- Questions (including those that mention Music/Kubernetes) are not treated as navigation. They require opting into remote transmission.
- When consent is checked, the operator enters a private Playground token. The Console forwards the bounded user/assistant history to the server configured conversational provider and streams the response.
- Chat history is kept only in React state for the current tab. **Clear** removes it; there is no database persistence.
- Unsupported requests, missing keys and provider errors show clear messages. A stopped response cancels the client request.
- No knowledge retrieval, citations, E.D.I.T.H. persona, voice synthesis or multi-step orchestrator are implemented by this first run.

See [CONVERSATION.md](./CONVERSATION.md).

## Local actions and model evaluation

The `/benchmarks` page compares Needle (actual client-side WASM inference) with a deterministic baseline against eight explicit tool-routing fixtures, including multi-tool requests and disabled-tool abstention. It displays actual model proposals and expected proposals, per-case latency, observed accuracy, and exports the current run as JSON. Until you press **Run benchmark**, it reports zero measured results, not a fabricated score. The Stop button stops **between cases**, not mid-WASM inference.

The `/playground` page executes accepted read-only demo actions through `@orivyn/actions`, not a separate ad-hoc validator. It includes an execution trace reporting accepted/rejected action names, reasons and synchronous handler time. It does **not** execute arbitrary scripts, navigation URLs or privileged actions.

See `docs/LOCAL_TOOLS.md`.

## Application Studio and independent consumer (v0.5)

`/applications` exposes the actual `@orivyn/runtime` manifest and context-aware capability registry. The operator can enable/disable read-only tools, switch route context, copy manifest JSON, apply deterministic local demo commands and inspect execution trace/state. It is ephemeral and requires no API.

`apps/example-consumer` is a **separate Next.js app on port 3001** that consumes public `@orivyn/*` imports. It registers its own `catalog.open`, `catalog.filter`, `catalog.select` actions through `createOrivynApp()` and can optionally invoke local Needle. It intentionally contains no CMS, API keys, chat or persistence.

See [APPLICATION_RUNTIME.md](./APPLICATION_RUNTIME.md) for the contract, examples, build commands and limitations.
