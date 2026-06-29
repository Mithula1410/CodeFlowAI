import time
import json
import logging
import traceback
from typing import Dict, Any, List, AsyncGenerator

from google import genai
from google.genai import types

from app.ai.base import BaseAIProvider
from app.core.config import settings

logger = logging.getLogger("app")


class GeminiAIProvider(BaseAIProvider):
    """Google Gemini AI Provider using the google-genai SDK (v1+)."""

    def __init__(self):
        if settings.GEMINI_API_KEY:
            api_key = settings.GEMINI_API_KEY.strip('"').strip("'")
            self._client = genai.Client(api_key=api_key)
            self._model_name = settings.DEFAULT_AI_MODEL or "gemini-2.5-flash"
            self._configured = True
            logger.info(f"Gemini provider initialized with model: {self._model_name}")
        else:
            self._configured = False
            self._client = None
            logger.warning("Gemini API Key is missing. Gemini provider will not function.")

    def _ensure_configured(self):
        if not self._configured:
            raise ValueError("Gemini provider is not configured. Please supply GEMINI_API_KEY in .env")

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

        try:
            response = self._client.models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=temperature,
                    response_mime_type="application/json",
                ),
            )
        except Exception as e:
            logger.error(f"Gemini generate_code API error:\n{traceback.format_exc()}")
            raise RuntimeError(f"Gemini API call failed: {e}") from e

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
                "model": self._model_name,
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

        try:
            response = self._client.models.generate_content(
                model=self._model_name,
                contents=f"Code to review:\n```{language}\n{code}\n```",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                ),
            )
        except Exception as e:
            logger.error(f"Gemini review_code API error:\n{traceback.format_exc()}")
            raise RuntimeError(f"Gemini API call failed: {e}") from e

        latency = int((time.time() - t0) * 1000)

        try:
            data = json.loads(response.text)
        except Exception:
            logger.error(f"Failed to parse Gemini review response as JSON: {response.text}")
            raise ValueError(f"Failed to parse Gemini response as JSON: {response.text[:200]}")

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
                "model": self._model_name,
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

        try:
            response = self._client.models.generate_content(
                model=self._model_name,
                contents=f"Code:\n{code}",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                ),
            )
        except Exception as e:
            logger.error(f"Gemini detect_bugs API error:\n{traceback.format_exc()}")
            raise RuntimeError(f"Gemini API call failed: {e}") from e

        latency = int((time.time() - t0) * 1000)

        try:
            data = json.loads(response.text)
        except Exception:
            logger.error(f"Failed to parse Gemini bug scan response as JSON: {response.text}")
            raise ValueError(f"Failed to parse Gemini response as JSON: {response.text[:200]}")

        meta = response.usage_metadata
        p_tokens = meta.prompt_token_count if meta else 0
        c_tokens = meta.candidates_token_count if meta else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "bugs": data.get("bugs", []),
            "metrics": {
                "provider": "gemini",
                "model": self._model_name,
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

        try:
            response = self._client.models.generate_content(
                model=self._model_name,
                contents=f"Code:\n{code}",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                ),
            )
        except Exception as e:
            logger.error(f"Gemini generate_documentation API error:\n{traceback.format_exc()}")
            raise RuntimeError(f"Gemini API call failed: {e}") from e

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
                "model": self._model_name,
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

        # Build history (all but last message)
        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append(
                types.Content(role=role, parts=[types.Part(text=msg["content"])])
            )

        try:
            chat_session = self._client.chats.create(
                model=self._model_name,
                config=types.GenerateContentConfig(system_instruction=system_prompt),
                history=history,
            )
            last_message = messages[-1]["content"]
            response = chat_session.send_message(last_message)
        except Exception as e:
            logger.error(f"Gemini chat API error:\n{traceback.format_exc()}")
            raise RuntimeError(f"Gemini API call failed: {e}") from e

        latency = int((time.time() - t0) * 1000)
        meta = response.usage_metadata
        p_tokens = meta.prompt_token_count if meta else 0
        c_tokens = meta.candidates_token_count if meta else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "message": response.text,
            "metrics": {
                "provider": "gemini",
                "model": self._model_name,
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
            history.append(
                types.Content(role=role, parts=[types.Part(text=msg["content"])])
            )

        try:
            chat_session = self._client.chats.create(
                model=self._model_name,
                config=types.GenerateContentConfig(system_instruction=system_prompt),
                history=history,
            )
            last_message = messages[-1]["content"]
            for chunk in chat_session.send_message_stream(last_message):
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini chat_stream API error:\n{traceback.format_exc()}")
            raise RuntimeError(f"Gemini streaming API call failed: {e}") from e
