import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeFlow AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # JWT & Auth
    SECRET_KEY: str = "codeflow_dev_secret_key_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # DB Connection
    DATABASE_URL: str = "sqlite:///./codeflow.db"

    # Redis Connection
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Keys
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    CLAUDE_API_KEY: str = ""
    
    # Default Provider Settings
    DEFAULT_AI_PROVIDER: str = "mock"
    DEFAULT_AI_MODEL: str = "mock-model"

    # GitHub
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:5173/github/callback"

    # Security
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
