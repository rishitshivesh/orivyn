"""Environment configuration."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    orivyn_inference_provider: str = "disabled"
    orivyn_api_key: str = ""
    orivyn_allowed_origins: str = "http://localhost:3000"
    orivyn_max_input_chars: int = 2000
    orivyn_max_tools: int = 20

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.orivyn_allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
