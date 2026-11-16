"""Environment configuration."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env", extra="ignore"
    )

    orivyn_inference_provider: str = "disabled"
    orivyn_api_key: str = ""
    orivyn_allowed_origins: str = "http://localhost:3000"
    orivyn_max_input_chars: int = 2000
    orivyn_max_tools: int = 20
    orivyn_chat_provider: str = "disabled"
    orivyn_chat_base_url: str = "https://api.openai.com/v1"
    orivyn_chat_api_key: str = ""
    orivyn_chat_model: str = ""
    orivyn_chat_max_output_tokens: int = 1024
    orivyn_chat_token_parameter: str = "max_tokens"
    orivyn_chat_timeout_seconds: float = 60.0
    orivyn_chat_allow_insecure_local: bool = False

    @property
    def allowed_origins(self) -> list[str]:
        return [
            origin.strip() for origin in self.orivyn_allowed_origins.split(",") if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
