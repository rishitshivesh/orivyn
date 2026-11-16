# Orivyn architecture

## Execution boundaries
1. **Browser**: public UI-only and read-only tool proposals; browser runtime must be explicit and stay in Web Workers. React application owns navigation, state, accessibility, and actual actions.
2. **Orivyn API**: authenticated app-bound tool proposals and inference; no implicit access to consumer data or secrets.
3. **Application backend**: source of truth for RBAC, payments, token issuance, private record retrieval, writes, transactions, and financial calculations.
4. **External providers**: opt-in. Explicit consent and payload disclosure are required before dispatch.

## Typed tool protocol
Input: `{app_id, input, tools:[{name, description, parameters, execution, risk}]}`.
Response: `{request_id, provider, proposals:[{name, arguments, confidence?}], status}`.
A proposal is never a completed action. Each consumer validates schemas, checks the real user/session, matches the exact allowlist, and confirms high-risk actions. UI-only commands may be executed by the owning frontend after validation.

## Dynamic runtime routing
Routing is based on operation sensitivity, app policy, device capability, and user consent, not only user preference.
- `browser` eligible: nonsecret, no protected backend access.
- `server` required: protected reads, financial or identity data, privileged integrations, writes.
- `external`: requires per-app policy and consent.
- `auto`: choose the least-privileged allowed execution environment, and fail explicitly if unavailable.

## Threat model
Untrusted input includes speech transcripts, documents, web content, tool descriptions from third parties, and model output. Treat all as data. Reject unexpected tool names, unexpected fields, unauthorized apps, oversized inputs, and malformed structured outputs. Never support arbitrary command execution or URL fetching from tool proposals. Add audit trails to any sensitive application integration.

## Cactus integration
Official package is `cactus-compute` (Apache-2.0). Needle 3 provides tool call suggestions via `Cactus.complete`. We intentionally never invoke `Cactus.run` in request handling because it executes tools. Model weights and native engine are downloaded/cached by the package on demand. A real inference smoke test requires online model initialization and is not equivalent to unit tests.

## Future work
Application registry and RBAC, revocable service keys, provider and capability manager, execution telemetry, browser WASM adapter, audio transcription, console, searchable knowledge, external agent adapters and policy simulator. No fake complete features.
