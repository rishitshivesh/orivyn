"""API lifecycle and access-boundary checks."""
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


def test_openapi_documents_proposal_route() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "/v1/proposals" in response.json()["paths"]
