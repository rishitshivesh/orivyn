# Deployment: Docker and Dokploy

## Prerequisites
- Docker/Compose support on the target host; avoid building native Cactus models on an unsupported CPU architecture.
- Provision a dedicated external DNS hostname for the API.
- Keep the API behind TLS termination, ideally Cloudflare + Dokploy reverse proxy.
- For backend access from other applications, implement service authentication/tenant isolation before public exposure. **The foundation inference endpoint is intentionally disabled until a key is configured.** This is not an authorization server.

## Dokploy API configuration
1. Create a Compose application from `rishitshivesh/orivyn`.
2. Use compose path `deploy/compose.dokploy.yml`, repository root as build context.
3. Set `ORIVYN_API_KEY` to a randomly generated secret (server-to-server only).
4. Set `ORIVYN_ALLOWED_ORIGINS` to specific HTTPS origins separated by commas; never wildcard with credentials.
5. Start with `ORIVYN_INFERENCE_PROVIDER=disabled` to verify deployment and health.
6. Connect service `api` port `8080` to your chosen HTTPS domain in Dokploy.
7. For model inference, rebuild with `INSTALL_CACTUS=true`, set `ORIVYN_INFERENCE_PROVIDER=cactus`, then test actual model behavior, architecture compatibility, memory and latency on your host.
8. Persist `/home/orivyn/.cache` so weights survive restarts. Initial model download requires outbound Internet.
9. Verify `GET /health/live` is fast and does not load models. `GET /health/ready` reports provider configuration, not model warmness.
10. Visit `https://<your-api-domain>/docs` for the Scalar OpenAPI reference. Export schema at `/openapi.json`.
11. Probe `POST /v1/proposals` using a server-side key. Never put that key in `NEXT_PUBLIC_*` or any browser bundle.

## Dokploy Console / Playground
Deploy `deploy/compose.playground.yml` as a separate Compose application with root as build context.

```env
ORIVYN_API_BASE=http://api:8080
ORIVYN_API_KEY=<same-server-only-key-as-api>
ORIVYN_PLAYGROUND_ACCESS_TOKEN=<separate-high-entropy-console-token>
NEXT_PUBLIC_ORIVYN_API_URL=https://api.your-domain.example
```

If API and Console live in **separate Dokploy Compose applications**, `http://api:8080` will not resolve unless both attach to a shared Docker network. Use your private accessible API hostname or explicitly configure a shared Docker network; do not assume container-name DNS spans Compose projects. For deployment instructions requiring fewer network modifications, set `ORIVYN_API_BASE` to the API HTTPS domain.

The Console status endpoint performs public metadata reads; the proposal proxy holds the API key only on the server. The Console interface itself is not yet a full identity-secured management platform. Put it behind an access gateway (e.g. Cloudflare Access) before making it publicly reachable. A token is required for proposal requests, but other views contain non-sensitive metadata and examples.

## Local API
```bash
uv sync --project apps/api --extra dev
uv run --project apps/api uvicorn orivyn_api.main:app --app-dir apps/api/src --host 127.0.0.1 --port 8080
```

## Local frontend
```bash
corepack enable
pnpm install
cp apps/playground/.env.example apps/playground/.env.local
pnpm dev:web
```

## Local Compose
```bash
cp apps/api/.env.example apps/api/.env
docker compose -f deploy/compose.dokploy.yml up --build
```

## Verification
```bash
pnpm format
pnpm check
pnpm typecheck
pnpm test
uv run --project apps/api ruff format apps/api
uv run --project apps/api ruff check apps/api
uv run --project apps/api pytest apps/api/tests
```

## Production hardening gate
Block public use until implemented/tested: per-application identity and key rotation, quotas and request budgets, origin restrictions, audit logging/redaction, model worker bounds/timeouts, versioned tool manifests, HTTPS proxy setup, secret rotation, and denial-of-service testing. The Async API timeout bounds response wait but cannot forcibly terminate native inference already running in a thread.

## Local browser inference asset verification

The frontend's `dev` and `build` commands run `scripts/sync-cactus-assets.mjs` which copies worker.js and needle.wasm from the installed `cactus-needle` npm package into `public/vendor/cactus/`. These are served from the application origin and copied into the standalone Docker image.

```bash
pnpm install
pnpm dev:web
# in another terminal
curl -I http://localhost:3000/vendor/cactus/worker.js
curl -I http://localhost:3000/vendor/cactus/needle.wasm
```

Expect HTTP 200 on both. These files are generated and intentionally ignored by Git. First inference additionally requires downloading the Needle model weights. No Python, FastAPI, GPU, or API key is needed for browser-only mode.
