# API reference

Orivyn publishes **OpenAPI 3.1** from FastAPI/Pydantic. The interactive reference uses **Scalar**, not Swagger UI or ReDoc.

- Interactive reference: `http://localhost:8080/docs`
- OpenAPI JSON: `http://localhost:8080/openapi.json`
- Runtime route source: `apps/api/src/orivyn_api/main.py`
- Request/response schemas: `apps/api/src/orivyn_api/schemas.py`
- Authorization: `apps/api/src/orivyn_api/security.py`

Do not maintain a manually copied OpenAPI JSON file. The schema is generated from the actual code. Add `summary`, `description`, `tags`, `response_model`, and explicit error responses to every new endpoint.

## Endpoint catalog

| Method | Route | Authentication | Description |
| --- | --- | --- | --- |
| GET | `/health/live` | None | Liveness without loading model weights |
| GET | `/health/ready` | None | Configured provider, **not** proof of loaded model |
| GET | `/v1/capabilities` | None | Public platform feature and limit metadata |
| POST | `/v1/proposals` | `X-Orivyn-Key` | Produce and validate non-executed tool proposals |
| GET | `/openapi.json` | None | Generated machine-readable OpenAPI |
| GET | `/docs` | None | Scalar reference documentation |

### GET /health/live
Response `200`: `{"status":"ok"}`. Must work without DB, external providers, or model weights.

### GET /health/ready
Response `200`: `{"status":"configured","provider":"disabled"}` by default. This is **configuration introspection**, not model warmup readiness.

### GET /v1/capabilities
Response `200`:
```json
{
  "version": "0.1.0",
  "provider": "disabled",
  "server_inference_enabled": false,
  "browser_inference_available": false,
  "tool_execution_enabled": false,
  "max_input_chars": 2000,
  "max_tools": 20,
  "features": ["tool-proposals", "schema-validation", "scalar-openapi"]
}
```
Metadata is public, must never include service keys, credentials, user data, or model prompts.

### POST /v1/proposals
Private service-to-service route. Only **read-only browser-targeted** tools are permitted in the foundation.

```bash
curl -X POST http://127.0.0.1:8080/v1/proposals \
  -H "Content-Type: application/json" \
  -H "X-Orivyn-Key: $ORIVYN_API_KEY" \
  -d '{
    "app_id": "portfolio",
    "input": "Open my music",
    "tools": [{
      "name": "navigate",
      "description": "Navigate to a public page",
      "execution": "browser",
      "risk": "read",
      "parameters": {
        "type": "object",
        "properties": { "page": { "type": "string", "enum": ["projects", "music"] } },
        "required": ["page"],
        "additionalProperties": false
      }
    }]
  }'
```

Successful response shape:
```json
{
  "request_id": "server-generated-uuid",
  "provider": "cactus",
  "status": "proposed",
  "proposals": [
    { "name": "navigate", "arguments": { "page": "music" }, "confidence": null }
  ]
}
```
The above is an illustrative response, not a guarantee of model output. `status=no_match` with empty proposals is valid. The server filters unrecognized tools and arguments that fail the registered JSON Schema.

Errors: `401` invalid key, `403` unsupported risk or target, `413` too-large input or too many tools, `422` malformed request/schema, `503` missing credentials/provider, `504` inference timeout. Default provider is disabled and will return `503` for a valid authenticated proposal.

**Never treat a proposal as permission to execute a tool.** The requesting application must revalidate its schema and authorization and confirm writes.

## Console's Next.js proxy routes

`apps/playground` also exposes two internal routes:
- `GET /api/status`: Reads FastAPI public health and capabilities server-side, returns `{connected, capabilities? | reason?}`. Used by the dashboard and runtime page.
- `POST /api/proposals`: Requires `Authorization: Bearer <ORIVYN_PLAYGROUND_ACCESS_TOKEN>`; forwards to backend using the private server-only `X-Orivyn-Key`. It is intentionally not part of FastAPI's OpenAPI document, and **not** a replacement for an application auth system.

These routes are separately implemented by Next.js. Future work may include a consolidated gateway OpenAPI spec once proxy contracts stabilize.

## Scalar configuration

Installed as the lightweight `scalar-fastapi` dependency. FastAPI disables Swagger UI and ReDoc and registers Scalar at `/docs`. The backend's `/openapi.json` remains unchanged. Scalar's browser-side try-it client must be used with care; never enter production service secrets on an untrusted/shared computer.

## API development checklist
- Implement Pydantic request and response models.
- Add precise operation summaries, tags and response status descriptions.
- Add tests for success, failure and auth boundaries.
- Update this endpoint catalog and the integration guide.
- Ensure no secrets are exposed in OpenAPI examples or response bodies.
