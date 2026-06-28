import time
import json
from typing import Dict, Any, List, AsyncGenerator
from anthropic import AsyncAnthropic
from app.ai.base import BaseAIProvider
from app.core.config import settings
from app.core.logging_config import logger

class ClaudeAIProvider(BaseAIProvider):
    def __init__(self):
        if settings.CLAUDE_API_KEY:
            self.client = AsyncAnthropic(api_key=settings.CLAUDE_API_KEY)
            self._configured = True
        else:
            self.client = None
            self._configured = False
            logger.warning("Claude API Key is missing. Claude provider will not function.")

    def _check_config(self):
        if not self._configured:
            raise ValueError("Claude provider is not configured. Please supply CLAUDE_API_KEY.")

    async def generate_code(
        self, prompt: str, language: str, framework: str, temperature: float
    ) -> Dict[str, Any]:
        self._check_config()
        t0 = time.time()
        model_name = "claude-3-5-sonnet-20240620"
        
        system_prompt = (
            f"You are a professional software engineer. Generate a solution in {language} "
            f"using the {framework} framework. Response MUST be in JSON format matching the schema:\n"
            '{"code": "the generated code string", "explanation": "a short text explanation"}\n'
            "Return ONLY raw JSON, with no wrapping."
        )
        
        response = await self.client.messages.create(
            model=model_name,
            max_tokens=4000,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature
        )
        
        latency = int((time.time() - t0) * 1000)
        content = response.content[0].text
        try:
            data = json.loads(content)
        except Exception:
            data = {"code": content, "explanation": "Failed to parse JSON."}

        p_tokens = response.usage.input_tokens if response.usage else 0
        c_tokens = response.usage.output_tokens if response.usage else 0
        cost = (p_tokens * 3.00 / 1000000) + (c_tokens * 15.00 / 1000000)

        return {
            "code": data.get("code", ""),
            "explanation": data.get("explanation", ""),
            "metrics": {
                "provider": "claude",
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
        model_name = "claude-3-5-sonnet-20240620"
        
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

        response = await self.client.messages.create(
            model=model_name,
            max_tokens=4000,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Code:\n```{language}\n{code}\n```"}]
        )
        
        latency = int((time.time() - t0) * 1000)
        content = response.content[0].text
        try:
            data = json.loads(content)
        except Exception:
            data = {"score_overall": 0.0, "issues": []}

        p_tokens = response.usage.input_tokens if response.usage else 0
        c_tokens = response.usage.output_tokens if response.usage else 0
        cost = (p_tokens * 3.00 / 1000000) + (c_tokens * 15.00 / 1000000)

        return {
            "score_overall": data.get("score_overall", 0.0),
            "score_security": data.get("score_security", 0.0),
            "score_performance": data.get("score_performance", 0.0),
            "score_readability": data.get("score_readability", 0.0),
            "score_maintainability": data.get("score_maintainability", 0.0),
            "issues": data.get("issues", []),
            "metrics": {
                "provider": "claude",
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
        model_name = "claude-3-5-sonnet-20240620"
        
        system_prompt = (
            "You are a Code Quality Scanner. Analyze the code specifically for bugs. "
            "Return a JSON object containing a list of bugs found with schema:\n"
            '{"bugs": [{"file_path": "filename", "line_number": 5, "severity": "critical|warning", "description": "bug explanation", "suggested_fix": "fix"}]}'
        )
        
        response = await self.client.messages.create(
            model=model_name,
            max_tokens=4000,
            system=system_prompt,
            messages=[{"role": "user", "content": code}]
        )
        
        latency = int((time.time() - t0) * 1000)
        content = response.content[0].text
        try:
            data = json.loads(content)
        except Exception:
            data = {"bugs": []}

        p_tokens = response.usage.input_tokens if response.usage else 0
        c_tokens = response.usage.output_tokens if response.usage else 0
        cost = (p_tokens * 3.00 / 1000000) + (c_tokens * 15.00 / 1000000)

        return {
            "bugs": data.get("bugs", []),
            "metrics": {
                "provider": "claude",
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
        model_name = "claude-3-5-sonnet-20240620"
        
        system_prompt = (
            f"Generate documentation of type '{doc_type}' for the provided code. "
            "Your output MUST be a JSON object with this schema:\n"
            '{"documentation": "Markdown documentation text"}'
        )
        
        response = await self.client.messages.create(
            model=model_name,
            max_tokens=4000,
            system=system_prompt,
            messages=[{"role": "user", "content": code}]
        )
        
        latency = int((time.time() - t0) * 1000)
        content = response.content[0].text
        try:
            data = json.loads(content)
        except Exception:
            data = {"documentation": content}

        p_tokens = response.usage.input_tokens if response.usage else 0
        c_tokens = response.usage.output_tokens if response.usage else 0
        cost = (p_tokens * 3.00 / 1000000) + (c_tokens * 15.00 / 1000000)

        return {
            "documentation": data.get("documentation", ""),
            "metrics": {
                "provider": "claude",
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
        model_name = "claude-3-5-sonnet-20240620"
        
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({"role": msg["role"], "content": msg["content"]})
            
        response = await self.client.messages.create(
            model=model_name,
            max_tokens=4000,
            system=system_prompt,
            messages=formatted_messages
        )
        
        latency = int((time.time() - t0) * 1000)
        text = response.content[0].text
        
        p_tokens = response.usage.input_tokens if response.usage else 0
        c_tokens = response.usage.output_tokens if response.usage else 0
        cost = (p_tokens * 3.00 / 1000000) + (c_tokens * 15.00 / 1000000)

        return {
            "message": text,
            "metrics": {
                "provider": "claude",
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
        model_name = "claude-3-5-sonnet-20240620"
        
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({"role": msg["role"], "content": msg["content"]})
            
        async with self.client.messages.stream(
            model=model_name,
            max_tokens=4000,
            system=system_prompt,
            messages=formatted_messages
        ) as stream:
            async for text in stream.text_stream:
                yield text
