import time
import json
from typing import Dict, Any, List, AsyncGenerator

from google import genai
from google.genai import types as genai_types

from app.ai.base import BaseAIProvider
from app.core.config import settings
from app.core.logging_config import logger

# Default model for all Gemini operations
_DEFAULT_MODEL = "gemini-2.0-flash"


class GeminiAIProvider(BaseAIProvider):
    """Google Gemini AI Provider using the google-genai SDK (v1+)."""

    def __init__(self):
        if settings.GEMINI_API_KEY:
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self._configured = True
        else:
            self._client = None
            self._configured = False
            logger.warning("Gemini API Key is missing. Gemini provider will not function.")

    def _ensure_configured(self):
        if not self._configured or self._client is None:
            raise ValueError("Gemini provider is not configured. Please supply GEMINI_API_KEY.")

    # -------------------------------------------------------------------------
    # Code Generation
    # -------------------------------------------------------------------------
    async def generate_code(
        self, prompt: str, language: str, framework: str, temperature: float
    ) -> Dict[str, Any]:
        self._ensure_configured()
        t0 = time.time()

        system_instruction = (
            f"You are a professional software engineer. Generate a solution in {language} "
            f"using the {framework} framework. Response MUST be raw JSON with schema: "
            '{"code": "...", "explanation": "..."} — no markdown fences.'
        )
        user_message = prompt

        response = self._client.models.generate_content(
            model=_DEFAULT_MODEL,
            contents=user_message,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
                response_mime_type="application/json",
            ),
        )

        latency = int((time.time() - t0) * 1000)
        try:
            data = json.loads(response.text)
        except Exception:
            data = {"code": response.text, "explanation": "Generated successfully."}

        meta = response.usage_metadata
        p_tokens = meta.prompt_token_count if meta else 0
        c_tokens = meta.candidates_token_count if meta else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "code": data.get("code", ""),
            "explanation": data.get("explanation", ""),
            "metrics": {
                "provider": "gemini",
                "model": _DEFAULT_MODEL,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency,
            },
        }

    # -------------------------------------------------------------------------
    # Code Review
    # -------------------------------------------------------------------------
    async def review_code(self, code: str, language: str) -> Dict[str, Any]:
        self._ensure_configured()
        t0 = time.time()

        system_instruction = (
            "You are a Senior Software Architect. Review the following code and return ONLY "
            "a raw JSON object (no markdown) with schema:\n"
            '{"score_overall":85.0,"score_security":90.0,"score_performance":80.0,'
            '"score_readability":85.0,"score_maintainability":90.0,'
            '"issues":[{"file_path":"...","line_number":0,"severity":"critical|warning|info",'
            '"category":"security|performance|style|bug","description":"...","suggested_fix":"..."}]}'
        )

        response = self._client.models.generate_content(
            model=_DEFAULT_MODEL,
            contents=f"Code to review:\n```{language}\n{code}\n```",
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )

        latency = int((time.time() - t0) * 1000)
        try:
            data = json.loads(response.text)
        except Exception:
            data = {
                "score_overall": 50.0,
                "score_security": 50.0,
                "score_performance": 50.0,
                "score_readability": 50.0,
                "score_maintainability": 50.0,
                "issues": [],
            }

        meta = response.usage_metadata
        p_tokens = meta.prompt_token_count if meta else 0
        c_tokens = meta.candidates_token_count if meta else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "score_overall": data.get("score_overall", 0.0),
            "score_security": data.get("score_security", 0.0),
            "score_performance": data.get("score_performance", 0.0),
            "score_readability": data.get("score_readability", 0.0),
            "score_maintainability": data.get("score_maintainability", 0.0),
            "issues": data.get("issues", []),
            "metrics": {
                "provider": "gemini",
                "model": _DEFAULT_MODEL,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency,
            },
        }

    # -------------------------------------------------------------------------
    # Bug Detection
    # -------------------------------------------------------------------------
    async def detect_bugs(self, code: str, language: str) -> Dict[str, Any]:
        self._ensure_configured()
        t0 = time.time()

        system_instruction = (
            "You are a Code Quality Scanner. Find all bugs, crashes and exceptions in the code. "
            'Return ONLY raw JSON: {"bugs":[{"file_path":"...","line_number":0,'
            '"severity":"critical|warning","description":"...","suggested_fix":"..."}]}'
        )

        response = self._client.models.generate_content(
            model=_DEFAULT_MODEL,
            contents=f"Code:\n{code}",
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )

        latency = int((time.time() - t0) * 1000)
        try:
            data = json.loads(response.text)
        except Exception:
            data = {"bugs": []}

        meta = response.usage_metadata
        p_tokens = meta.prompt_token_count if meta else 0
        c_tokens = meta.candidates_token_count if meta else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "bugs": data.get("bugs", []),
            "metrics": {
                "provider": "gemini",
                "model": _DEFAULT_MODEL,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency,
            },
        }

    # -------------------------------------------------------------------------
    # Documentation Generation
    # -------------------------------------------------------------------------
    async def generate_documentation(self, code: str, doc_type: str) -> Dict[str, Any]:
        self._ensure_configured()
        t0 = time.time()

        system_instruction = (
            f"Generate {doc_type} documentation for the provided code. "
            'Return ONLY raw JSON: {"documentation":"Markdown text here"}'
        )

        response = self._client.models.generate_content(
            model=_DEFAULT_MODEL,
            contents=f"Code:\n{code}",
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )

        latency = int((time.time() - t0) * 1000)
        try:
            data = json.loads(response.text)
        except Exception:
            data = {"documentation": response.text}

        meta = response.usage_metadata
        p_tokens = meta.prompt_token_count if meta else 0
        c_tokens = meta.candidates_token_count if meta else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "documentation": data.get("documentation", ""),
            "metrics": {
                "provider": "gemini",
                "model": _DEFAULT_MODEL,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency,
            },
        }

    # -------------------------------------------------------------------------
    # Chat (non-streaming)
    # -------------------------------------------------------------------------
    async def chat(self, messages: List[Dict[str, str]], system_prompt: str) -> Dict[str, Any]:
        self._ensure_configured()
        t0 = time.time()

        # Build history in google-genai Content format
        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append(genai_types.Content(role=role, parts=[genai_types.Part(text=msg["content"])]))

        chat = self._client.chats.create(
            model=_DEFAULT_MODEL,
            config=genai_types.GenerateContentConfig(system_instruction=system_prompt),
            history=history,
        )
        last_message = messages[-1]["content"]
        response = chat.send_message(last_message)

        latency = int((time.time() - t0) * 1000)
        meta = response.usage_metadata
        p_tokens = meta.prompt_token_count if meta else 0
        c_tokens = meta.candidates_token_count if meta else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "message": response.text,
            "metrics": {
                "provider": "gemini",
                "model": _DEFAULT_MODEL,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency,
            },
        }

    # -------------------------------------------------------------------------
    # Chat Streaming
    # -------------------------------------------------------------------------
    async def chat_stream(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> AsyncGenerator[str, None]:
        self._ensure_configured()

        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append(genai_types.Content(role=role, parts=[genai_types.Part(text=msg["content"])]))

        chat = self._client.chats.create(
            model=_DEFAULT_MODEL,
            config=genai_types.GenerateContentConfig(system_instruction=system_prompt),
            history=history,
        )

        for chunk in chat.send_message_stream(messages[-1]["content"]):
            if chunk.text:
                yield chunk.text
