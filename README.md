# Orivyn

**Intelligence, wherever it belongs.**

Orivyn is a frontend-first, model-agnostic intelligence platform designed around **typed, non-executed tool proposals**. Consumer applications retain authorization, data ownership and final action execution.

## Current build: Intelligence Preview (v0.3)

The repository contains a Next.js console interface, a FastAPI API with Scalar OpenAPI documentation, reusable TypeScript packages, and optional browser/server Cactus inference.

**Delivered interface**

- `/`: Overview with live backend status.
- `/playground`: Natural-language tool proposal lab.
- `/tools`: Explicit example tool definitions and JSON Schemas.
- `/runtimes`: Server/browser/external runtime topology and capability status.
- `/guide`: Developer documentation and API reference shortcuts.

The example tool registry is static; the Playground now supports explicit, schema-validated demo action execution (navigation/filter/reset) after user review. Browser Needle/Whistle adapters still require real-browser production build verification. The API does not execute tools. Payment and auth actions are not implemented. Read `docs/INTERFACE.md` for the complete delivered/planned feature matrix.

## Repository layout

```text
apps/
  api/            FastAPI, validation, inference provider adapter, Scalar reference
  playground/     Next.js Console and read-only sample tool Playground
packages/
  core/           Typed action/proposal contracts
  client/         Server transport
  react/          React hook
  browser/        Browser adapter interface (no WASM implementation yet)
deploy/           Docker Compose / Dokploy
docs/             Architecture, API, UI, integrations, deployment
AGENTS.md         Engineering and documentation requirements
```

## Start locally

Requires Node 22+, pnpm 10+, Python 3.12+ and uv.

```bash
corepack enable
pnpm install
uv sync --project apps/api --extra dev
cp apps/api/.env.example apps/api/.env
cp apps/playground/.env.example apps/playground/.env.local
```

Terminal one:

```bash
pnpm dev:api
```

Terminal two:

```bash
pnpm dev:web
```

- Console: http://localhost:3000
- Scalar OpenAPI: http://localhost:8080/docs
- OpenAPI JSON: http://localhost:8080/openapi.json
- API health: http://localhost:8080/health/live

Backend model inference is disabled by default. Browser Needle/Whistle requires explicit local use and external model asset downloads. To enable optional server-side Cactus inference, install `uv sync --project apps/api --extra dev --extra cactus`, configure `ORIVYN_INFERENCE_PROVIDER=cactus`, `ORIVYN_API_KEY`, and a separate `ORIVYN_PLAYGROUND_ACCESS_TOKEN` in the Next.js environment. Models may download on first inference.

## Quality checks

```bash
pnpm format
pnpm check
pnpm typecheck
pnpm test
uv run --project apps/api ruff format apps/api
uv run --project apps/api ruff check apps/api
uv run --project apps/api pytest apps/api/tests
```

**Verification transparency:** Source authored through the GitHub connector has not undergone a successful local dependency install, full Biome/TypeScript/Python test run, browser visual inspection, or Docker build in this environment. Run these checks before production use.

## Documentation

- [Engineering rules](AGENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Console interface](docs/INTERFACE.md)
- [API reference](docs/API_REFERENCE.md)
- [Application integrations](docs/INTEGRATIONS.md)
- [Browser inference and voice](docs/BROWSER_RUNTIME.md)
- [Deployment](docs/DEPLOYMENT.md)

No GitHub Actions or workflow automation is included.

## Local browser runtime prerequisites

Only Node.js 22.18+, pnpm, an HTTPS/localhost origin and a WebAssembly/module-worker capable browser are required. No Python service, Docker or GPU is needed for the local Playground. The `dev:web` and frontend build scripts copy the bundled Cactus worker/WASM assets to the public directory automatically. Needle and Whistle model weights are downloaded on first use and cached where the browser supports it. See [Browser runtime setup](docs/BROWSER_RUNTIME.md).

## Reliable commands and action execution

The Playground now has a **Reliable actions** mode for a small, explicit demo command grammar. It never claims to be an LLM. The Needle and Backend modes continue to propose tool calls via inference. In all modes, **Apply to demo** validates and applies the proposal to a visible demo application state, never to your real Portfolio OS.

See [Agent strategy](docs/AGENT_STRATEGY.md) and [Interface](docs/INTERFACE.md) for intended E.D.I.T.H. reasoning vs tool-routing responsibilities.

## Agent Lab and conversational inference (v0.3)

The `/agent` console route offers conservative local action routing and opt-in server-side conversation. Configure an OpenAI-compatible backend provider only when desired. `POST /v1/chat` and `POST /v1/chat/stream` are now documented by Scalar. See [Conversation engine](docs/CONVERSATION.md) for the complete setup and security boundaries. There is no provider configured by default, and this release does not yet include retrieval or durable memory.

## Local tools and benchmarking

- **`/playground`**: Run Needle or the deterministic baseline, review proposals and click Apply to demo. The UI displays an action trace from the reusable `@orivyn/actions` package.
- **`/benchmarks`**: Compare twelve golden tool-routing cases against either local Needle/WASM or deterministic rules. Inspect exact expected/actual JSON, measured latency and export a JSON report.
- Both work without the FastAPI API, external chat providers, accounts or secrets.

Use `pnpm dev:web`; see [Local Tools guide](docs/LOCAL_TOOLS.md).

The benchmark screen is an evaluation harness, not a promise of model accuracy. Any model accuracy percentage is calculated only after an actual browser run.

The previous opt-in chat integration remains available for future work, but is **not required or used** by the v0.4 local tool executor and benchmark screen.

## v0.5: Application Runtime & SDK

The Console now includes `/applications` for manifest/context/tool inspection. A separate application, `apps/example-consumer`, runs on port 3001 and imports public Orivyn packages. The new `@orivyn/runtime` package offers manifests, runtime isolation, context-scoped tools, dynamic registration and subscribable execution state. `@orivyn/react` adds `createOrivynApp()` with typed Provider and hooks.

```bash
pnpm install --no-frozen-lockfile
pnpm dev:web      # console on 3000
pnpm dev:example  # separate catalog consumer on 3001
```

No API or chat provider is needed. Start with [Application Runtime documentation](docs/APPLICATION_RUNTIME.md). The source-based workspace package exports require Next.js `transpilePackages`; external npm publishing awaits a proper build/packaging pipeline. Regenerate the pnpm lockfile after installation.

## v0.6 Local Runtime Reliability

Needle/Whistle initialization now exposes model-specific progress, explicit cancellation, bounded inference and idle session cleanup. The Playground also resamples microphone input to the 16 kHz mono PCM required by Whistle. No provider keys or chat backend are required. [v0.6 guide](docs/BROWSER_RUNTIME_V06.md).

The GitHub source changes have **not** been fully built/tested with installed dependencies in this environment; run the release quality gate locally before deployment.

Quality follow-up: React hook factories, accessibility labels, stable row keys and callback-return lint violations were corrected in the November 17 Biome cleanup. Run the full local checks before declaring the release green.

## npm package publishing

The six SDK packages can be compiled into npm-ready ESM JavaScript and TypeScript declarations with `pnpm release:npm --scope @your-org --version X.Y.Z` (dry run). Actual publication requires `--publish`, npm login and 2FA. See [npm release guide](docs/NPM_PUBLISHING.md). The publisher stages build artifacts under ignored `.release/npm` and does not publish raw TypeScript source exports.
