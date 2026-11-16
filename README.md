# Orivyn

**Intelligence, wherever it belongs.**

Orivyn is a frontend-first, model-agnostic intelligence platform designed around **typed, non-executed tool proposals**. Consumer applications retain authorization, data ownership and final action execution.

## Current build: Foundation / Console Preview (v0.1)

The repository contains a Next.js console interface, a FastAPI API with Scalar OpenAPI documentation, reusable TypeScript packages, and optional browser/server Cactus inference.

**Delivered interface**
- `/`: Overview with live backend status.
- `/playground`: Natural-language tool proposal lab.
- `/tools`: Explicit example tool definitions and JSON Schemas.
- `/runtimes`: Server/browser/external runtime topology and capability status.
- `/guide`: Developer documentation and API reference shortcuts.

The example tool registry is static; browser Needle/Whistle adapters are implemented but require real-browser production build verification. The API does not execute tools. Payment and auth actions are not implemented. Read `docs/INTERFACE.md` for the complete delivered/planned feature matrix.

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
