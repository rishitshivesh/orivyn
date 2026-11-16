# Orivyn engineering instructions

Read this file before changing any code. These are binding project rules for people and coding agents.

## Architecture
- Orivyn is a generic, frontend-first, self-hostable intelligence platform, not an E.D.I.T.H.-specific backend.
- Every file has one clear responsibility. Keep modules small and cohesive; do not duplicate business rules, schema definitions, error handling, or network clients.
- Prefer simple functions, composition, typed interfaces, and shared utilities. No clever abstractions without concrete reuse.
- Applications own their own data, business logic, authorization, and transaction commits. Orivyn handles intent, context, execution routing, safe tool proposals, and inference.
- Browser execution is preferred for public, UI-only operations when the device supports it. Sensitive operations always cross an authenticated application backend.
- Never expose internal application API keys or service credentials to browsers. Never turn untrusted model output into arbitrary code or arbitrary URLs.
- Tool calls are proposals. Validate every argument against a registered schema; validate app identity, scope, authorization, and confirmation policy before execution.
- Do not silently fall back from local/browser inference to remote inference. Surface provider selection and data transfer choices.
- Integrations with other agent providers must be adapters behind stable contracts. Cactus is one optional inference engine, not a dependency of Orivyn Core.
- Optimize for minimal dependencies, startup time, memory footprint, and predictable deployments. Never start all models just to serve a health check.

## Frontend
- React + Next.js App Router, Tailwind, shadcn/ui components only for application controls.
- Reuse shadcn primitives, never ad hoc lookalike controls. Semantic layout elements are fine; avoid raw HTML inputs/buttons where shadcn equivalents exist.
- Accessible keyboard navigation and responsive mobile/desktop layouts are mandatory.
- Models should drive typed UI actions and render existing components, not fabricate HTML or execute JavaScript.
- Streaming, voice, and browser workers must not block the main UI thread.

## Backend
- FastAPI Python service isolated in apps/api; use pyproject.toml and a private .venv via uv.
- Keep inference behind a provider adapter. Do not load weights during import.
- /health/live must work with no weights, database, or external providers.
- I/O and inference timeouts, request-size limits, bounded concurrency, structured errors, request IDs, and explicit CORS origin allowlists are required before production use.
- Do not add PostgreSQL, Redis, MongoDB, a queue, or a vector database until a real capability requires it.
- Never use model guesses for permission checks, payment authorization, security scoring, money movement, or account access decisions.

## Packages and SDK
- Keep the public API small, versioned, ESM-compatible, and documented.
- Shared contracts live in @orivyn/core. @orivyn/client is transport only. @orivyn/react wraps client hooks. @orivyn/browser is for local execution.
- Avoid circular dependencies. Do not copy model/runtime implementation into SDK packages.
- Publishing is optional; local workspace linking works first. Consumers may use npm packages or Git submodules. Package versions follow semver.
- Application registration must permit dynamic capability configuration and future external agents.

## Quality gate before every commit
1. Read changed files and verify they match the intended behavior.
2. Run `pnpm format` then `pnpm check` (Biome), `pnpm typecheck`, and relevant tests.
3. Run `uv run --project apps/api ruff check apps/api`, `uv run --project apps/api ruff format --check apps/api`, and `uv run --project apps/api pytest apps/api/tests`.
4. Verify API OpenAPI contract and Docker builds when their dependencies/tools are available.
5. Document any command you could not execute. Never report success for unrun checks.
6. No GitHub Actions or automated GitHub workflows. Local verification is a prerequisite for commits.
7. Never add secrets, generated artifacts, build output, models, caches, or virtual environments to git.

## Collaboration and release
- Make coherent, tested increments. Prefer implementation + tests + docs in one change.
- Add docs under docs/ and keep deployment commands runnable.
- Follow existing implementation patterns from music-streaming-backend: backend-owned long-lived service credentials, short-lived scoped browser capabilities, key rotation and auditability for sensitive integrations.
- Avoid porting music domain logic or unnecessary services.
- No placeholders masquerading as working features. Label planned/incomplete features explicitly.

## Documentation ownership
- Every new public API route must have OpenAPI tags, summary, precise request/response/error models and a test proving it appears in /openapi.json.
- Scalar at /docs is the interactive reference. Do not reintroduce Swagger UI.
- Keep docs/API_REFERENCE.md updated when routes change; keep docs/INTERFACE.md updated when UI routes, behavior, or controls change.
- Document real, incomplete, and planned functionality separately. Never fabricate uptime, token usage, registered apps, model metrics or test results.
- Every new frontend route should expose accessible states for loading, errors, empty results and disabled capabilities.

## Browser runtime implementation
- Cactus Needle/Whistle are integrated through `@orivyn/browser`; consumers import Orivyn wrappers rather than third-party internal APIs.
- Never call `Needle.run()` to execute tools. Use `generate()`/propose only and validate results before application execution.
- Voice requires explicit microphone permission and local recording. Stop capture tracks in finally blocks. No audio upload to the Orivyn API in local mode.
- Keep browser model weights lazy and don't silently fall back to backend or paid providers.
- Before releasing local runtime, run Next.js production bundling and test both actual WASM tool proposals and speech transcription in Chromium. Follow with Safari/mobile compatibility tests.
- Read docs/BROWSER_RUNTIME.md when changing model runtime behavior; update it alongside any integration or privacy change.

- For Next.js apps, publish the package's exported WASM/worker assets as same-origin public files and always pass explicit `workerUrl` and `wasmUrl` to Cactus constructors. Never assume dependency-relative `import.meta.url` resolves in Next's bundled client output.
- The Playground's `sync-cactus-assets.mjs` must run before development and production builds. Verify the standalone Docker image carries `public/vendor/cactus`.

## Action quality and regression coverage
- Treat tiny tool-calling models as routers only, not conversational or knowledge models.
- Prefer deterministic parsing for known UI commands; return unsupported for unmatched inputs rather than hallucinating action calls.
- Every UI tool needs a real host-owned handler and a visible outcome. Tool schemas alone are not functional integrations.
- Explicitly validate model output again immediately before executing the action; never execute model-generated arbitrary URLs or JavaScript.
- Add regression fixtures for supported commands, disabled tools and malformed parameters whenever tool definitions change.
- Keep docs/AGENT_STRATEGY.md synchronized with reasoning and routing behavior.
