"""Server-side API key authentication for initial private deployments."""
from hmac import compare_digest

from fastapi import Header, HTTPException, status

from orivyn_api.settings import get_settings


def require_api_key(x_orivyn_key: str | None = Header(default=None)) -> None:
    expected = get_settings().orivyn_api_key
    if not expected:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="API key not configured")
    if x_orivyn_key is None or not compare_digest(expected, x_orivyn_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
