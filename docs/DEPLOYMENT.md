# Deployment: Docker and Dokploy

## Prerequisites
- Docker/Compose support on the target host; avoid building native Cactus models on an unsupported CPU architecture.
- Provision a dedicated external DNS hostname for the API.
- Keep the API behind TLS termination, ideally Cloudflare + Dokploy reverse proxy.
- For backend access from other applications, implement service authentication/tenant isolation before public exposure. **The foundation inference endpoint is intentionally disabled until a key is configured.** This is not an authorization server.

## Dokploy configuration
1. Create a Compose application from `rishitshivesh/orivyn`.
2. Use compose path `deploy/compose.dokploy.yml`, project root as build context.
3. Set `ORIVYN_API_KEY` to a randomly generated secret (server-to-server only).
4. Set `ORIVYN_ALLOWED_ORIGINS` to specific HTTPS origins separated by commas; never wildcard with credentials.
5. Start with `ORIVYN_INFERENCE_PROVIDER=disabled` to verify deployment and health.
6. Connect service `api` port `8080` to your chosen HTTPS domain in Dokploy.
7. For model inference, rebuild with cactus extra enabled as documented in Dockerfile, enable `ORIVYN_INFERENCE_PROVIDER=cactus`, and test memory and latency on your actual host.
8. Persist `/home/orivyn/.cache` if enabled so weights survive restarts. Initial model download requires outbound Internet.
9. Verify `GET /health/live` is fast and does not load models. `GET /health/ready` reports provider configuration, not model warmness.
10. Probe `POST /v1/proposals` using a server-side key. Never put that key in `NEXT_PUBLIC_*` or any browser bundle.

## Local API
```bash
uv sync --project apps/api --extra dev
uv run --project apps/api uvicorn orivyn_api.main:app --app-dir apps/api/src --host 127.0.0.1 --port 8080
```

## Local Compose
```bash
cp apps/api/.env.example apps/api/.env
docker compose -f deploy/compose.dokploy.yml up --build
```

## Production hardening gate
Block public use until implemented/tested: per-application identity and key rotation, quotas and request budgets, origin restrictions, audit logging/redaction, model worker bounds/timeouts, versioned tool manifests, HTTPS proxy setup, secret rotation, and denial-of-service testing.
