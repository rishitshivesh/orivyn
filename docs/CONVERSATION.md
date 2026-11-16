# Orivyn v0.3: Conversation provider and routing

## Scope of this run

- Optional OpenAI-compatible HTTP chat provider, server-side only.
- `POST /v1/chat`: complete a text conversation.
- `POST /v1/chat/stream`: SSE text generation.
- `/agent`: frontend-first lab, deterministic command routing, explicit opt-in remote chat, streaming conversation UI.
- TypeScript `ChatRequest` / `ChatResponse` SDK contracts and `OrivynClient.chat()` / `streamChat()`.
- Scalar OpenAPI for every new FastAPI endpoint, plus regression tests.

Not shipped: knowledge retrieval, indexed CMS data, multi-step reasoning with tools, persistent chat memory, external agent-to-agent routing, automatic provider fallback, provider cost analytics, or a public agent auth system.

## Why this is not Needle

Needle is a small structured function-calling model. It is not used for open-ended explanatory conversation. `@orivyn/browser` remains available for local inference and Whistle voice input. The Agent Lab's local router uses only the known demo commands and abstains for questions.

## Privacy and execution boundaries

1. Known demo navigation/filter actions stay in the browser. They are proposals reviewed before application-owned execution.
2. Questions require operator opt-in and a Playground access token.
3. The Next.js proxy holds the Orivyn API service key privately and forwards conversation text/history to FastAPI.
4. FastAPI forwards the bounded messages to exactly the configured provider endpoint. Provider credentials remain on the server.
5. No new conversation state is persisted. The browser sends recent turns each request.
6. The chat engine never gets a tool registry and cannot execute payments, identity changes or arbitrary code.
7. There is no automatic server fallback from local Needle inference.

Provider policies apply to content transmitted to the external service. Use a trusted local compatible provider if data must remain on infrastructure you control.

## Set up locally

Requires Node 22.18+, pnpm 10+, Python 3.12+, uv:

```bash
pnpm install
uv sync --project apps/api --extra dev
cp apps/api/.env.example apps/api/.env
cp apps/playground/.env.example apps/playground/.env.local
```

Set the API environment to:

```env
ORIVYN_API_KEY=<generate-a-long-random-private-key>
ORIVYN_CHAT_PROVIDER=openai-compatible
ORIVYN_CHAT_BASE_URL=https://api.openai.com/v1
ORIVYN_CHAT_API_KEY=<your-provider-key>
ORIVYN_CHAT_MODEL=<valid-model-name-for-your-provider>
ORIVYN_CHAT_TOKEN_PARAMETER=max_tokens
```

Set the Console environment to:

```env
ORIVYN_API_BASE=http://localhost:8080
ORIVYN_API_KEY=<same-orivyn-private-key>
ORIVYN_PLAYGROUND_ACCESS_TOKEN=<different-random-token>
```

Restart the two applications after changing environment values:

```bash
pnpm dev:api
pnpm dev:web
```

Visit `http://localhost:3000/agent`. Try "Open music" without any provider. For questions, check the opt-in box, provide the Playground token and send a message. You should see incremental text rather than waiting for one large JSON response.

Do not set `NEXT_PUBLIC_ORIVYN_CHAT_API_KEY`, because it would leak credentials.

## Streaming protocol

SSE response `text/event-stream` with `event: meta` (request/model info), repeated `event: delta` (text fragment), `event: done` (completion), and `event: error` (provider failure). The UI rejects a stream that terminates without `done`.

The provider uses a compatible `POST /chat/completions` request with standard messages, model, max_tokens and stream boolean. Some providers require different request parameters; implement future adapters rather than hardcoding provider-specific changes into this generic one.

## Testing and operational limits

Run `pnpm check`, `pnpm typecheck`, `pnpm test`, Python Ruff and pytest, and start the service to verify `/docs`, non-streaming completions and streaming chunks with the selected provider. Browser privacy/network checks should verify no chat request is sent before consent.

This is an operator-facing preview. Before external access, add per-app auth, quotas, provider request budgets, audit controls and a vetted provider URL allowlist. HTTP is refused except when the operator explicitly enables localhost development mode.

## Troubleshooting

- 503: provider disabled or missing API key/model.
- 401: Playground or Orivyn service credentials mismatch.
- 502: upstream provider unavailable, incompatible response or network failure.
- SSE `error`: upstream failed after streaming began.
- Local commands work but questions don't: this is expected until a conversational provider is configured.

For providers that require `max_completion_tokens` rather than `max_tokens`, set `ORIVYN_CHAT_TOKEN_PARAMETER=max_completion_tokens`. The adapter intentionally omits forced temperature because not all OpenAI-compatible reasoning models accept that field.

## SDK consumption

`@orivyn/core` exports typed `ChatMessage`, `ChatRequest` and `ChatResponse` interfaces. `@orivyn/client` exposes `client.chat()` and `client.streamChat()` for transport, and `@orivyn/react` provides `useOrivynChat()` for non-streaming integration. These clients must invoke an authenticated application backend/proxy where service credentials remain private. The current Console uses a dedicated SSE proxy for incremental text.
