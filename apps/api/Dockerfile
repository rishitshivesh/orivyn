FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    CACTUS_TELEMETRY=0 \
    ORIVYN_INFERENCE_PROVIDER=disabled
WORKDIR /app
RUN pip install --no-cache-dir "uv>=0.9,<1"
COPY apps/api/pyproject.toml /app/pyproject.toml
COPY apps/api/src /app/src
ARG INSTALL_CACTUS=false
RUN if [ "$INSTALL_CACTUS" = "true" ]; then uv pip install --system -e ".[cactus]"; else uv pip install --system -e .; fi
RUN useradd --create-home orivyn
USER orivyn
EXPOSE 8080
CMD ["uvicorn", "orivyn_api.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
