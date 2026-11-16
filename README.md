# Orivyn

**Intelligence, wherever it belongs.**

A frontend-first, model-agnostic platform for connecting natural-language intent to safe, typed application capabilities. Local browser execution, managed backend inference, and third-party provider adapters are distinct execution targets.

## Status
**Foundation (v0.1, early implementation).** The core tool contract, HTTP SDK, React hook, FastAPI proposal endpoint, and opt-in Cactus adapter are being introduced. The Console and browser inference UI are not yet production-ready. Do not deploy this publicly as a trusted action execution system until the hardening checklist is complete.

## Structure
- `apps/api`: FastAPI proposal and capability API with lazily loaded model adapters
- `apps/playground`: Next.js App Router user interface
- `packages/core`: typed tool contracts and client-side validation
- `packages/client`: transport client for the API
- `packages/react`: React hooks for application integration
- `packages/browser`: local browser runtime interface
- `docs/`: architecture and Dokploy runbooks

## Develop
Requires Node 22+, pnpm 10+, Python 3.12+, [uv](https://docs.astral.sh/uv/).

```bash
corepack enable
pnpm install
uv sync --project apps/api --extra dev
cp apps/api/.env.example apps/api/.env
cp apps/playground/.env.example apps/playground/.env.local
pnpm dev:api
# in another terminal:
pnpm dev:web
```

Health: http://localhost:8080/health/live; API documentation: http://localhost:8080/docs; Playground: http://localhost:3000.

The native Cactus engine and model weights are **optional**. Enable via `uv sync --project apps/api --extra cactus` then `ORIVYN_INFERENCE_PROVIDER=cactus`; model downloads happen on first request. No inference should load for a simple health check.

## Verification
```bash
pnpm format
pnpm check
pnpm typecheck
pnpm test
uv run --project apps/api ruff check apps/api
uv run --project apps/api ruff format --check apps/api
uv run --project apps/api pytest apps/api/tests
```

Read [AGENTS.md](./AGENTS.md) before contributing. No GitHub Actions are configured.
