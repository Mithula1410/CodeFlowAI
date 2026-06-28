import time
import json
from typing import Dict, Any, List, AsyncGenerator
import google.generativeai as genai
from app.ai.base import BaseAIProvider
from app.core.config import settings
from app.core.logging_config import logger

class GeminiAIProvider(BaseAIProvider):
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._configured = True
        else:
            self._configured = False
            logger.warning("Gemini API Key is missing. Gemini provider will not function.")

    def _get_model(self, model_name: str = "gemini-1.5-flash"):
        if not self._configured:
            raise ValueError("Gemini provider is not configured. Please supply GEMINI_API_KEY.")
        return genai.GenerativeModel(model_name)

    async def generate_code(
        self, prompt: str, language: str, framework: str, temperature: float
    ) -> Dict[str, Any]:
        t0 = time.time()
        model_name = "gemini-1.5-flash"
        
        system_prompt = (
            f"You are a professional software engineer. Generate a solution in {language} "
            f"using the {framework} framework. Response MUST be in JSON format matching the schema:\n"
            '{"code": "the generated code string", "explanation": "a short text explanation"}\n'
            "Do not include any outer markdown formatting like ```json or ```, return ONLY the raw JSON string."
        )
        
        model = self._get_model(model_name)
        response = model.generate_content(
            f"System context:\n{system_prompt}\n\nUser request:\n{prompt}",
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                response_mime_type="application/json"
            )
        )
        
        latency = int((time.time() - t0) * 1000)
        try:
            data = json.loads(response.text)
        except Exception:
            data = {"code": response.text, "explanation": "Generated successfully but failed to parse JSON structure."}
            
        # Standard token usage metadata
        metadata = response.usage_metadata
        p_tokens = metadata.prompt_token_count if metadata else 0
        c_tokens = metadata.candidates_token_count if metadata else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000) # Est. cost

        return {
            "code": data.get("code", ""),
            "explanation": data.get("explanation", ""),
            "metrics": {
                "provider": "gemini",
                "model": model_name,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency
            }
        }

    async def review_code(self, code: str, language: str) -> Dict[str, Any]:
        t0 = time.time()
        model_name = "gemini-1.5-flash"
        
        system_prompt = (
            "You are a Senior Software Architect. Review the following code. "
            "You MUST return your response in JSON format matching this schema:\n"
            "{\n"
            '  "score_overall": 85.0,\n'
            '  "score_security": 90.0,\n'
            '  "score_performance": 80.0,\n'
            '  "score_readability": 85.0,\n'
            '  "score_maintainability": 90.0,\n'
            '  "issues": [\n'
            '    {\n'
            '      "file_path": "path_or_filename",\n'
            '      "line_number": 12,\n'
            '      "severity": "critical|warning|info",\n'
            '      "category": "security|performance|style|bug",\n'
            '      "description": "Vulnerability or issue summary",\n'
            '      "suggested_fix": "Code patch or remediation steps"\n'
            '    }\n'
            '  ]\n'
            "}\n"
            "Ensure all scores are floats out of 100. Do not include markdown code block syntax in the response."
        )

        model = self._get_model(model_name)
        response = model.generate_content(
            f"System context:\n{system_prompt}\n\nCode to review:\n```{language}\n{code}\n```",
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
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
                "issues": [{"file_path": "unknown", "line_number": 0, "severity": "error", "category": "bug", "description": response.text, "suggested_fix": ""}]
            }

        metadata = response.usage_metadata
        p_tokens = metadata.prompt_token_count if metadata else 0
        c_tokens = metadata.candidates_token_count if metadata else 0
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
                "model": model_name,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency
            }
        }

    async def detect_bugs(self, code: str, language: str) -> Dict[str, Any]:
        t0 = time.time()
        model_name = "gemini-1.5-flash"
        
        system_prompt = (
            "You are a Code Quality Scanner. Analyze the code specifically for bugs, crashes, and exceptions. "
            "Return a JSON object containing a list of bugs found with schema:\n"
            "{\n"
            '  "bugs": [\n'
            '    {\n'
            '      "file_path": "filename",\n'
            '      "line_number": 5,\n'
            '      "severity": "critical|warning",\n'
            '      "description": "bug explanation",\n'
            '      "suggested_fix": "fix solution"\n'
            '    }\n'
            '  ]\n'
            "}"
        )
        
        model = self._get_model(model_name)
        response = model.generate_content(
            f"System context:\n{system_prompt}\n\nCode:\n{code}",
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        latency = int((time.time() - t0) * 1000)
        try:
            data = json.loads(response.text)
        except Exception:
            data = {"bugs": []}

        metadata = response.usage_metadata
        p_tokens = metadata.prompt_token_count if metadata else 0
        c_tokens = metadata.candidates_token_count if metadata else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "bugs": data.get("bugs", []),
            "metrics": {
                "provider": "gemini",
                "model": model_name,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency
            }
        }

    async def generate_documentation(self, code: str, doc_type: str) -> Dict[str, Any]:
        t0 = time.time()
        model_name = "gemini-1.5-flash"
        
        system_prompt = (
            f"Generate structural documentation of type '{doc_type}' for the provided code. "
            "Your output MUST be a JSON object with this schema:\n"
            '{"documentation": "Markdown documentation text"}\n'
            "Ensure the markdown text is properly escaped and structured."
        )
        
        model = self._get_model(model_name)
        response = model.generate_content(
            f"System context:\n{system_prompt}\n\nCode:\n{code}",
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        latency = int((time.time() - t0) * 1000)
        try:
            data = json.loads(response.text)
        except Exception:
            data = {"documentation": response.text}

        metadata = response.usage_metadata
        p_tokens = metadata.prompt_token_count if metadata else 0
        c_tokens = metadata.candidates_token_count if metadata else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "documentation": data.get("documentation", ""),
            "metrics": {
                "provider": "gemini",
                "model": model_name,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency
            }
        }

    async def chat(self, messages: List[Dict[str, str]], system_prompt: str) -> Dict[str, Any]:
        t0 = time.time()
        model_name = "gemini-1.5-flash"
        
        formatted_contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            formatted_contents.append({"role": role, "parts": [msg["content"]]})
            
        model = self._get_model(model_name)
        
        # Insert system instructions
        chat_session = model.start_chat(history=formatted_contents[:-1])
        response = chat_session.send_message(
            formatted_contents[-1]["parts"][0]
        )
        
        latency = int((time.time() - t0) * 1000)
        metadata = response.usage_metadata
        p_tokens = metadata.prompt_token_count if metadata else 0
        c_tokens = metadata.candidates_token_count if metadata else 0
        cost = (p_tokens * 0.000075 / 1000) + (c_tokens * 0.00025 / 1000)

        return {
            "message": response.text,
            "metrics": {
                "provider": "gemini",
                "model": model_name,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency
            }
        }

    async def chat_stream(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> AsyncGenerator[str, None]:
        model_name = "gemini-1.5-flash"
        formatted_contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            formatted_contents.append({"role": role, "parts": [msg["content"]]})
            
        model = self._get_model(model_name)
        chat_session = model.start_chat(history=formatted_contents[:-1])
        
        response = chat_session.send_message(
            formatted_contents[-1]["parts"][0],
            stream=True
        )
        for chunk in response:
            yield chunk.text
