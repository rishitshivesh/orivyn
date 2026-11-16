# Orivyn Console interface

The Orivyn Console frontend lives in `apps/playground`. It is a Next.js App Router application using Tailwind v4 and local shadcn-style components. Its screens use real backend data where available and clearly identify features that are not implemented.

## Routes

| Route | Purpose | Data source | Access |
| --- | --- | --- | --- |
| `/` | Overview dashboard with live API connection and provider status | `GET /api/status` Next proxy | Public UI, read-only public metadata |
| `/playground` | Tool proposal lab; prompts, sample tool selection and JSON result | `POST /api/proposals` protected Next proxy | Requires Playground access token |
| `/tools` | Inspect registered example tool definitions and JSON Schemas | `src/lib/capabilities.ts` | Public, read-only, **not persistent registry** |
| `/runtimes` | Runtime architecture and actual server provider status | `GET /api/status` | Public metadata |
| `/guide` | Developer quickstart, API references and docs | GitHub and FastAPI Scalar | Public docs |

## Design rules
- App shell: persistent sidebar on desktop and horizontally scrollable nav on mobile.
- Layout: dark, cool charcoal surfaces; restrained periwinkle accent; subtle borders. Avoid fake data metrics.
- Controls: button, input, textarea, badge and card are local shadcn-style primitives. Never add one-off controls directly to pages where a reusable primitive exists.
- Make actions accessible via regular navigation, button labels and input labels.
- Use `PageHeading` as the common page header and `useApiStatus` for live API diagnostics.
- Keep workflows in individual route files; extract shared utilities when duplicated.

## What works
- Navigation among five screens.
- Public status from FastAPI via Next.js proxy.
- Sample read-only tool enable/disable controls.
- Authenticated model proposal requests through a server-only proxy (requires keys and Cactus runtime).
- JSON response inspection and copy; example prompt shortcuts; reset.
- Docs linking to Scalar and repository Markdown.

## Intentionally incomplete
- Browser WebAssembly model inference (only runtime interface exists).
- Live audio capture, speech transcription, conversational agent UI.
- Persistent application registration, tool registry storage and admin management.
- Provider benchmarking, usage analytics, billing, and agent workflow building.
- Complete authentication solution for management console.

Do not label incomplete capabilities as live. The protected proxy expects `ORIVYN_PLAYGROUND_ACCESS_TOKEN`, `ORIVYN_API_KEY`, and `ORIVYN_API_BASE`. The access token is supplied by the operator in the UI; it is never the backend service key.

## Environment

```env
ORIVYN_API_BASE=http://localhost:8080
ORIVYN_API_KEY=<private-backend-key>
ORIVYN_PLAYGROUND_ACCESS_TOKEN=<separate-private-playground-key>
NEXT_PUBLIC_ORIVYN_API_URL=http://localhost:8080
```

The NEXT_PUBLIC URL is only for docs links. Never place keys in public variables.

## Review checklist
1. Start the API and web app; inspect on desktop and mobile.
2. `/` reports API reachable when backend runs, offline when stopped.
3. `/runtimes` shows the configured provider from live metadata.
4. `/tools` renders two sample JSON Schemas.
5. `/playground` denies requests without a valid token and displays actual responses when inference is enabled.
6. Visit `/guide` and the FastAPI `/docs` Scalar reference.
7. Confirm browser bundle contains no `ORIVYN_API_KEY` and no backend secret.
8. Run Biome, TypeScript checks, Python tests, and Docker builds before production deployment.

## Quality limitations
The first interface implementation was authored through a repository connector without a runnable Node install in this tool environment. Build, browser visual review and formatting must be verified on a machine with dependencies installed. Do not mistake source presence for a passed end-to-end test.
