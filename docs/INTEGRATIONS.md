# Integrations and application SDK

## Public frontend capabilities
Use `@orivyn/core` to register typed, allowlisted UI tools. A browser runtime must run in a Web Worker and may not receive service keys. The `@orivyn/browser` package currently defines the adapter interface; a concrete WASM integration has **not** been shipped.

## Server-side proposal flow
1. An authenticated consumer backend receives user input.
2. The backend constructs the tool list based on application policy and authenticated user permissions.
3. It calls Orivyn `POST /v1/proposals` with `X-Orivyn-Key`.
4. Orivyn returns tool **proposals**, not executed actions.
5. The consumer checks each proposal against its own allowlist and validates argument schema and permission scope.
6. For sensitive operations it shows an explicit confirmation and uses its normal backend handler. A proposal must never trigger a direct payment, access-control mutation, or privileged operation.

## Private backend SDK example
```ts
import { OrivynClient } from "@orivyn/client";

const client = new OrivynClient(process.env.ORIVYN_API_BASE!);
const response = await client.propose({
  app_id: "portfolio",
  input: "Open projects",
  tools: [{
    name: "navigate",
    description: "Open a public page",
    parameters: { type: "object", properties: { page: { type: "string" } } },
    execution: "browser",
    risk: "read",
  }],
}, { headers: { "X-Orivyn-Key": process.env.ORIVYN_API_KEY! } });
```

The browser MUST NOT receive the API key. Use an authenticated application-owned route to invoke the backend SDK. The example above is only valid on trusted server infrastructure.

## Future extension points
- Per-app capability manifest, revocable credentials, quotas, fine-grained policies
- Browser-side Cactus Needle/Whistle inference and microphone opt-in
- Third-party agent adapters using explicit user consent
- Scoped ephemeral browser tokens, like the music streaming backend's external integration approach
- Audited management console for model provisioning and telemetry
