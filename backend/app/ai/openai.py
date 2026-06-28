import time
import json
from typing import Dict, Any, List, AsyncGenerator
from openai import AsyncOpenAI
from app.ai.base import BaseAIProvider
from app.core.config import settings
from app.core.logging_config import logger

class OpenAIProvider(BaseAIProvider):
    def __init__(self):
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self._configured = True
        else:
            self.client = None
            self._configured = False
            logger.warning("OpenAI API Key is missing. OpenAI provider will not function.")

    def _check_config(self):
        if not self._configured:
            raise ValueError("OpenAI provider is not configured. Please supply OPENAI_API_KEY.")

    async def generate_code(
        self, prompt: str, language: str, framework: str, temperature: float
    ) -> Dict[str, Any]:
        self._check_config()
        t0 = time.time()
        model_name = "gpt-4o-mini"
        
        system_prompt = (
            f"You are a professional software engineer. Generate a solution in {language} "
            f"using the {framework} framework. Response MUST be in JSON format matching the schema:\n"
            '{"code": "the generated code string", "explanation": "a short text explanation"}\n'
            "Return ONLY raw JSON."
        )
        
        response = await self.client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            response_format={"type": "json_object"}
        )
        
        latency = int((time.time() - t0) * 1000)
        content = response.choices[0].message.content
        try:
            data = json.loads(content)
        except Exception:
            data = {"code": content, "explanation": "Failed to parse JSON."}

        p_tokens = response.usage.prompt_tokens if response.usage else 0
        c_tokens = response.usage.completion_tokens if response.usage else 0
        cost = (p_tokens * 0.000150 / 1000) + (c_tokens * 0.000600 / 1000)

        return {
            "code": data.get("code", ""),
            "explanation": data.get("explanation", ""),
            "metrics": {
                "provider": "openai",
                "model": model_name,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency
            }
        }

    async def review_code(self, code: str, language: str) -> Dict[str, Any]:
        self._check_config()
        t0 = time.time()
        model_name = "gpt-4o-mini"
        
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
            "}"
        )

        response = await self.client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Code:\n```{language}\n{code}\n```"}
            ],
            response_format={"type": "json_object"}
        )
        
        latency = int((time.time() - t0) * 1000)
        content = response.choices[0].message.content
        try:
            data = json.loads(content)
        except Exception:
            data = {"score_overall": 0.0, "issues": []}

        p_tokens = response.usage.prompt_tokens if response.usage else 0
        c_tokens = response.usage.completion_tokens if response.usage else 0
        cost = (p_tokens * 0.000150 / 1000) + (c_tokens * 0.000600 / 1000)

        return {
            "score_overall": data.get("score_overall", 0.0),
            "score_security": data.get("score_security", 0.0),
            "score_performance": data.get("score_performance", 0.0),
            "score_readability": data.get("score_readability", 0.0),
            "score_maintainability": data.get("score_maintainability", 0.0),
            "issues": data.get("issues", []),
            "metrics": {
                "provider": "openai",
                "model": model_name,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency
            }
        }

    async def detect_bugs(self, code: str, language: str) -> Dict[str, Any]:
        self._check_config()
        t0 = time.time()
        model_name = "gpt-4o-mini"
        
        system_prompt = (
            "You are a Code Quality Scanner. Analyze the code specifically for bugs. "
            "Return a JSON object containing a list of bugs found with schema:\n"
            '{"bugs": [{"file_path": "filename", "line_number": 5, "severity": "critical|warning", "description": "bug explanation", "suggested_fix": "fix"}]}'
        )
        
        response = await self.client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": code}
            ],
            response_format={"type": "json_object"}
        )
        
        latency = int((time.time() - t0) * 1000)
        content = response.choices[0].message.content
        try:
            data = json.loads(content)
        except Exception:
            data = {"bugs": []}

        p_tokens = response.usage.prompt_tokens if response.usage else 0
        c_tokens = response.usage.completion_tokens if response.usage else 0
        cost = (p_tokens * 0.000150 / 1000) + (c_tokens * 0.000600 / 1000)

        return {
            "bugs": data.get("bugs", []),
            "metrics": {
                "provider": "openai",
                "model": model_name,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency
            }
        }

    async def generate_documentation(self, code: str, doc_type: str) -> Dict[str, Any]:
        self._check_config()
        t0 = time.time()
        model_name = "gpt-4o-mini"
        
        system_prompt = (
            f"Generate documentation of type '{doc_type}' for the provided code. "
            "Your output MUST be a JSON object with this schema:\n"
            '{"documentation": "Markdown documentation text"}'
        )
        
        response = await self.client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": code}
            ],
            response_format={"type": "json_object"}
        )
        
        latency = int((time.time() - t0) * 1000)
        content = response.choices[0].message.content
        try:
            data = json.loads(content)
        except Exception:
            data = {"documentation": content}

        p_tokens = response.usage.prompt_tokens if response.usage else 0
        c_tokens = response.usage.completion_tokens if response.usage else 0
        cost = (p_tokens * 0.000150 / 1000) + (c_tokens * 0.000600 / 1000)

        return {
            "documentation": data.get("documentation", ""),
            "metrics": {
                "provider": "openai",
                "model": model_name,
                "prompt_tokens": p_tokens,
                "completion_tokens": c_tokens,
                "cost": round(cost, 6),
                "response_time_ms": latency
            }
        }

    async def chat(self, messages: List[Dict[str, str]], system_prompt: str) -> Dict[str, Any]:
        self._check_config()
        t0 = time.time()
        model_name = "gpt-4o-mini"
        
        formatted_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            formatted_messages.append({"role": msg["role"], "content": msg["content"]})
            
        response = await self.client.chat.completions.create(
            model=model_name,
            messages=formatted_messages
        )
        
        latency = int((time.time() - t0) * 1000)
        text = response.choices[0].message.content
        
        p_tokens = response.usage.prompt_tokens if response.usage else 0
        c_tokens = response.usage.completion_tokens if response.usage else 0
        cost = (p_tokens * 0.000150 / 1000) + (c_tokens * 0.000600 / 1000)

        return {
            "message": text,
            "metrics": {
                "provider": "openai",
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
        self._check_config()
        model_name = "gpt-4o-mini"
        
        formatted_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            formatted_messages.append({"role": msg["role"], "content": msg["content"]})
            
        response = await self.client.chat.completions.create(
            model=model_name,
            messages=formatted_messages,
            stream=True
        )
        
        async for chunk in response:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta
