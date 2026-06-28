import logging
from app.ai.base import BaseAIProvider
from app.ai.gemini import GeminiAIProvider
from app.ai.openai import OpenAIProvider
from app.ai.claude import ClaudeAIProvider
from app.ai.mock import MockAIProvider
from app.core.config import settings

logger = logging.getLogger("app")

# Singletons cache
_providers = {}

def get_ai_provider(provider_name: str = None) -> BaseAIProvider:
    """Returns the requested AI Provider class, falling back to mock if keys are missing."""
    if not provider_name:
        provider_name = settings.DEFAULT_AI_PROVIDER
    
    provider_name = provider_name.lower().strip()
    
    # Check singleton cache
    if provider_name in _providers:
        return _providers[provider_name]
        
    try:
        if provider_name == "gemini":
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not set.")
            provider = GeminiAIProvider()
        elif provider_name == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is not set.")
            provider = OpenAIProvider()
        elif provider_name == "claude":
            if not settings.CLAUDE_API_KEY:
                raise ValueError("CLAUDE_API_KEY is not set.")
            provider = ClaudeAIProvider()
        else:
            provider = MockAIProvider()
    except Exception as e:
        logger.warning(
            f"Failed to initialize requested provider '{provider_name}': {str(e)}. "
            "Falling back to Mock AI Provider."
        )
        provider = MockAIProvider()
        provider_name = "mock"

    _providers[provider_name] = provider
    return provider
