from abc import ABC, abstractmethod
from typing import Dict, Any, List, Generator, AsyncGenerator

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_code(
        self, prompt: str, language: str, framework: str, temperature: float
    ) -> Dict[str, Any]:
        """Generate code based on prompt, language, and framework."""
        pass

    @abstractmethod
    async def review_code(self, code: str, language: str) -> Dict[str, Any]:
        """Perform a structured review of the provided code, returning scores and issue items."""
        pass

    @abstractmethod
    async def detect_bugs(self, code: str, language: str) -> Dict[str, Any]:
        """Scan code specifically for syntax errors, logical bugs, and vulnerabilities."""
        pass

    @abstractmethod
    async def generate_documentation(self, code: str, doc_type: str) -> Dict[str, Any]:
        """Generate documentation (e.g. README, API docs, or inline comments)."""
        pass

    @abstractmethod
    async def chat(self, messages: List[Dict[str, str]], system_prompt: str) -> Dict[str, Any]:
        """Send chat history and system prompt, returning the assistant response."""
        pass

    @abstractmethod
    async def chat_stream(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> AsyncGenerator[str, None]:
        """Stream chat chunks asynchronously."""
        pass
