# Orivyn Console interface

The frontend is a Next.js App Router application in `apps/playground`, with local shadcn-style controls and a responsive console shell.

## Pages

| Route | Description |
| --- | --- |
| `/` | Dashboard with API configuration/capability status |
| `/playground` | Local/remote runtime selector, tool proposal lab, local Whistle voice input, validated JSON output |
| `/tools` | Read-only example tool definitions and JSON Schema |
| `/runtimes` | Architecture and server provider diagnostics |
| `/guide` | SDK, API and development documentation |

## Local inference

The Playground defaults to local browser inference. After an explicit click, the optional `cactus-needle/browser` adapter loads Needle into a WebAssembly module worker. It accepts only read-only browser-targeted tools, validates resulting JSON arguments, and returns proposals, not executed actions. Whistle can be activated independently using an explicit microphone click. See [BROWSER_RUNTIME.md](./BROWSER_RUNTIME.md).

## Backend inference

The explicit Backend API tab uses the protected Next.js route `POST /api/proposals` with a Playground access token and private backend credential. Unlike browser mode, input is sent to the server.

## Development

```bash
corepack enable
pnpm install
pnpm dev:web
```

No API or token is required to access local browser mode. To test server mode, configure the FastAPI runtime, API key and Playground proxy token as described in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Truthful feature inventory

Working as source implementations, pending real-browser verification: example tool selection, local Needle proposal adapter, Whistle audio capture/transcription, JSON response display, runtime selection. Existing backend provider and Scalar docs are separately configured. **Not implemented:** a persistent management registry, full app registration/auth UI, voice streaming, executing frontend actions, external agent router, payments workflows or model benchmarking.

## Build verification

This revision was prepared through GitHub repository connector rather than an environment with installed workspace dependencies. Actual Chromium/Next.js production build, voice test, Biome format and TypeScript typecheck have not been completed in this editing environment. Run those before production use.
