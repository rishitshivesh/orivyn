"""API lifecycle, documentation, and access-boundary checks."""

from fastapi.testclient import TestClient

from orivyn_api.main import app

client = TestClient(app)


def test_liveness_does_not_need_weights() -> None:
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_missing_server_key_fails_closed() -> None:
    response = client.post(
        "/v1/proposals",
        json={
            "app_id": "portfolio",
            "input": "open projects",
            "tools": [
                {
                    "name": "navigate",
                    "description": "Navigate to a page",
                    "parameters": {"type": "object", "properties": {}},
                }
            ],
        },
    )
    assert response.status_code in {401, 503}


def test_openapi_documents_all_routes() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert {"/v1/proposals", "/v1/capabilities", "/health/live", "/health/ready"} <= set(paths)
    assert paths["/v1/proposals"]["post"]["tags"] == ["Inference"]


def test_scalar_replaces_swagger() -> None:
    response = client.get("/docs")
    assert response.status_code == 200
    assert "scalar" in response.text.lower()
    assert client.get("/redoc").status_code == 404


def test_capabilities_reflect_provider_config() -> None:
    response = client.get("/v1/capabilities")
    assert response.status_code == 200
    payload = response.json()
    assert payload["tool_execution_enabled"] is False
    assert payload["browser_inference_available"] is False
    assert payload["version"] == app.version
