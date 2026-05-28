"""Configuration for LightRAG microservice."""

from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings


def _find_mineecho_env() -> str | None:
    """Auto-discover MineEcho's .env file to reuse the same API key."""
    candidates = [
        # BFF local config (most common for dev)
        Path(__file__).parent.parent / "bff" / ".mineecho" / ".env",
        # Project root
        Path(__file__).parent.parent.parent / ".mineecho" / ".env",
        # MineEcho home
        Path(os.getenv("MINEECHO_CONFIG_HOME", "")) / ".env",
        # Current working directory
        Path.cwd() / ".mineecho" / ".env",
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    return None


def _load_env_file(path: str) -> dict[str, str]:
    """Parse a simple KEY=VALUE .env file."""
    result: dict[str, str] = {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    result[key.strip()] = value.strip()
    except Exception:
        pass
    return result


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # LLM / Embedding
    light_rag_llm_model: str = "minimax-m2.5"
    light_rag_embedding_model: str = "embo-01"
    light_rag_openai_base_url: str | None = "https://api.minimaxi.com/v1"
    light_rag_api_key: str = ""

    # MiniMax embedding uses a slightly different host
    minimax_embedding_base_url: str = "https://api.minimax.chat/v1"

    # Storage
    light_rag_working_dir: str = "./lightrag_working_dir"

    # Server
    light_rag_port: int = 3090
    light_rag_host: str = "0.0.0.0"

    # Logging
    log_level: str = "INFO"

    class Config:
        env_prefix = ""
        case_sensitive = False


# ---------------------------------------------------------------------------
# Boot-time auto-discovery: if LIGHT_RAG_API_KEY is not set, try to read
# MineEcho's .env and pick up MINIMAX_API_KEY so users only configure once.
# ---------------------------------------------------------------------------
_env_key = os.environ.get("LIGHT_RAG_API_KEY", "")
if not _env_key:
    _mineecho_env_path = _find_mineecho_env()
    if _mineecho_env_path:
        _mineecho_vars = _load_env_file(_mineecho_env_path)
        _minimax_key = _mineecho_vars.get("MINIMAX_API_KEY", "")
        if _minimax_key:
            os.environ["LIGHT_RAG_API_KEY"] = _minimax_key
            # Also make it available as OPENAI_API_KEY so the openai SDK picks it up
            os.environ.setdefault("OPENAI_API_KEY", _minimax_key)

settings = Settings()
