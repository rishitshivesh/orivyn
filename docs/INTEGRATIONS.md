# Orivyn integrations

## Local, browser-first integration

Install the workspace package `@orivyn/browser` (or publish its versioned npm package later). It wraps the third-party Needle/Whistle implementation and keeps consumer code independent of Cactus internals.

```tsx
"use client";

import { CactusBrowserRuntime } from "@orivyn/browser";

const runtime = new CactusBrowserRuntime();

// Call after explicit user gesture, preferably a button click:
const prediction = await runtime.propose({
  app_id: "portfolio",
  input: "Open the music app",
  tools: [
    {
      name: "navigate",
      description: "Navigate to a public route",
      parameters: {
        type: "object",
        properties: { page: { type: "string", enum: ["music", "projects"] } },
        required: ["page"],
        additionalProperties: false,
      },
      execution: "browser",
      risk: "read",
    },
  ],
});

// Validate again with your app's actual registry, then optionally handle
// the proposal. Never assume that inference output has authorization.
console.log(prediction.proposals);
await runtime.close();
```

The adapter makes no privileged network request. Avoid importing it into server components. Browser model assets download only on first use. [Detailed browser guide](./BROWSER_RUNTIME.md).

## Protected application integrations

1. Authenticated application backend receives user intent.
2. Backend supplies only tool schemas that user can access.
3. Server calls `POST /v1/proposals` with its private `X-Orivyn-Key`.
4. Orivyn returns proposed calls. Each application validates schema/permission again.
5. Writes, payments and identity changes require authenticated backend handler and explicit user confirmation.

```ts
import { OrivynClient } from "@orivyn/client";

const client = new OrivynClient(process.env.ORIVYN_API_BASE!);
const response = await client.propose(
  {
    app_id: "portfolio",
    input: "Open projects",
    tools: [
      {
        name: "navigate",
        description: "Navigate to a public page",
        parameters: {
          type: "object",
          properties: { page: { type: "string" } },
        },
        execution: "browser",
        risk: "read",
      },
    ],
  },
  { headers: { "X-Orivyn-Key": process.env.ORIVYN_API_KEY! } },
);
```

The current API is intentionally restricted to read-only browser proposals, including when invoked server-side. Backend privileged actions are NOT enabled until registered app policies and authentication are implemented.

## Planned extension points

- Authenticated per-app manifest and signing keys, service identity and limits.
- Audited application integration registry with credential rotation.
- Typed executor for UI-only actions.
- Model provider plugins, agent interoperability, and developer middleware.
