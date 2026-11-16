# Orivyn v0.5: Application Runtime

## Delivered

Orivyn now supports independently mounted applications with **typed manifests**, a **dynamic in-memory tool registry**, **context-aware eligibility**, and an **app-owned action executor**. No database, hosted LLM, credentials or central registration service is required.

- `@orivyn/runtime`: framework-independent application lifecycle, manifest validation, subscriptions, context and capability gating.
- `@orivyn/react`: `createOrivynApp<State>()` returning a typed Provider and hooks.
- `@orivyn/actions`: existing schema-validated, synchronous host-owned action execution.
- `@orivyn/browser`: optional Needle/Whistle browser inference, injected as an adapter when explicitly requested.
- Console `/applications`: inspect local manifest JSON, route context, eligible tools, enable/disable state and execution traces.
- `apps/example-consumer`: **separate Next.js application** using only public `@orivyn/*` package imports for its integration. It does not depend on `apps/playground`.

## Start both applications

Requires Node >=22.18, Corepack and pnpm 10.20.0.

```bash
corepack enable
pnpm install --no-frozen-lockfile
pnpm dev:web       # http://localhost:3000
```

In a second terminal:

```bash
pnpm dev:example   # http://localhost:3001
```

The Console Application Studio does not need FastAPI. The separate consumer can exercise catalog navigation/filter/selection **without loading any model** by using host-created proposals. Clicking **Run Needle locally** explicitly loads the browser model and proposes actions. Model weights and WASM assets are fetched only on demand.

The `pnpm-lock.yaml` lockfile needs regeneration because v0.5 adds workspace packages; use `pnpm install --no-frozen-lockfile` once and commit the regenerated lockfile after verification. Do not publish packages directly from their `src/*.ts` exports until a distribution build is added. In this version, the packages are intended for local workspace use and Next.js `transpilePackages`.

## Manifest

```ts
import { defineApplication } from "@orivyn/runtime";

export const manifest = defineApplication({
  id: "my.catalog",
  name: "My Catalog",
  version: "0.5.0",
  runtime: "browser",
  tools: [
    {
      name: "catalog.open",
      description: "Open an allowed catalog page",
      execution: "browser",
      risk: "read",
      parameters: {
        type: "object",
        properties: { page: { type: "string", enum: ["catalog", "about"] } },
        required: ["page"],
        additionalProperties: false,
      },
    },
  ],
});
```

Manifest validation rejects duplicate tool names, invalid identifiers, malformed top-level schema shapes and protected server/write/sensitive tools. **v0.5 only supports browser read-level UI actions**. A future backend integration will be a separate authenticated execution path, not a browser policy override.

## React integration

```tsx
"use client";

import { createOrivynApp } from "@orivyn/react";
import { manifest } from "./manifest";

type State = { page: "catalog" | "about" };
const { Provider, useOrivyn, useOrivynTool } = createOrivynApp<State>(manifest);

function Registration() {
  useOrivynTool({
    definition: manifest.tools[0],
    execute: (state, args) => ({ ...state, page: args.page as State["page"] }),
  });
  return null;
}

function Workspace() {
  const app = useOrivyn();
  // Calling app.createRequest(input) sends only currently eligible tool schemas.
  // app.propose(input, browserRuntime) asks a supplied model adapter to suggest actions.
  // Proposals are *never* auto-executed. A host UI calls app.apply(proposals)
  // after approval; the executor repeats schema/eligibility validation.
  return (
    <button
      onClick={() =>
        app.apply([
          {
            name: "catalog.open",
            arguments: { page: "about" },
            confidence: null,
          },
        ])
      }
    >
      {app.state.page}
    </button>
  );
}

export default function App() {
  return (
    <Provider
      initialState={{ page: "catalog" }}
      context={{ route: "/catalog" }}
    >
      <Registration />
      <Workspace />
    </Provider>
  );
}
```

The above is a minimal API example, not the production UI component style. In shipped frontend screens, use shadcn buttons and controls.

### Hooks and runtime methods

`createOrivynApp<State>(manifest)` returns:

- `Provider`: one independent runtime per mount
- `useOrivyn()`: state snapshot, context, available tools, enabled names, manifest, `setEnabled`, `updateContext`, `createRequest`, `propose`, `apply`, `busy`, `error`
- `useOrivynTool(registration)`: mount/unmount lifecycle for application-owned handler and optional context predicate
- `useRuntime()`: lower-level runtime access for advanced integrations

`createApplicationRuntime<State>({manifest, initialState, context, registrations})` is available outside React with `subscribe/getSnapshot`, `register`, `setEnabled`, `updateContext`, `createRequest`, `execute` and `dispose`.

## Context eligibility

A context comprises `route` (relative path), optional `selection` and up to 16 basic `attributes`. `available(context)` may dynamically remove a tool from proposals and execution. Updating context recomputes eligibility, and `useSyncExternalStore` updates subscribing React components. A manifest alone never gives the model access to arbitrary features. Only **registered, enabled, context-eligible** tools reach the model.

The example consumer exposes `catalog.filter` and `catalog.select` only on `/catalog`; when the user changes to `/about`, those tools disappear and previously produced proposals cannot be applied.

## Data isolation and safety

- Each `ApplicationRuntime` owns its own state, registrations and enabled flags, without a module-level singleton.
- Tool schemas must match their manifest definitions. Duplicate registrations and unknown tools throw.
- Execution uses `@orivyn/actions`, revalidating JSON Schema, the current allowlist and browser read-only policy; it never evaluates model-generated code or URLs.
- Inference adapters receive only the current application ID, prompt, and eligible tool list.
- No automatic inference or network fallback; external models are not selected by the runtime.
- The runtime is UI-only and **does not provide server-side authorization**. Never pass secrets/private transactions into browser context or models.
- App handlers should be pure state transitions. Execution tracing is local and is not a security audit record.
- The React Provider retains its runtime while mounted. It does not call `dispose()` in a useEffect cleanup because React Strict Mode replays effect cleanup on development remount; event listeners and tool registrations unsubscribe through hook cleanup, and unreferenced runtime instances are garbage-collected.

## Deployment

- Console: `deploy/compose.playground.yml` (existing).
- Independent consumer: `deploy/compose.example.yml`, Dockerfile `apps/example-consumer/Dockerfile`, exposed internal port 3001.
- Model-worker and WASM assets are published into each application's own `public/vendor/cactus` via shared `packages/browser/scripts/sync-assets.mjs` before `next dev/build`.
- Use separate Dokploy service domains and configure TLS. No API hostname or secret is needed for the standalone example.
- The example's bundled worker assets are public runtime assets, not credentials.

## Test plan

```bash
pnpm install --no-frozen-lockfile
pnpm format
pnpm check
pnpm typecheck
pnpm test
pnpm --filter @orivyn/playground build
pnpm --filter @orivyn/example-consumer build
```

Then check:

1. `/applications`: enable/disable, change route and verify eligible tools.
2. `localhost:3001`: catalog navigation and filtering using local host-created proposals.
3. `localhost:3001`: local Needle inference, inspect and apply valid actions.
4. Switch to About: filter and select tools must vanish; old tool proposals must be rejected.
5. Refresh: local-only state resets, no leaked app settings.
6. Check the browser Network tab: no model prompt leaves the browser during local inference.

**Verification status:** Source was authored via GitHub connector; a real dependency install, Biome, typecheck, Node tests, both Next.js builds and browser QA have not run in this environment. Do not call this production-verified.
