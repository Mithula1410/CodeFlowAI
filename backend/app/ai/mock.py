import asyncio
import random
from typing import Dict, Any, List, AsyncGenerator
from app.ai.base import BaseAIProvider

class MockAIProvider(BaseAIProvider):
    async def generate_code(
        self, prompt: str, language: str, framework: str, temperature: float
    ) -> Dict[str, Any]:
        await asyncio.sleep(1.0)  # Simulate latency
        
        # Simple template matching
        if "login" in prompt.lower():
            code = (
                "// Generated Login Controller\n"
                "async function handleLogin(req, res) {\n"
                "  const { email, password } = req.body;\n"
                "  if (!email || !password) {\n"
                "    return res.status(400).json({ error: 'Missing credentials' });\n"
                "  }\n"
                "  try {\n"
                "    const user = await db.findUser(email);\n"
                "    if (!user || !compareHash(password, user.password)) {\n"
                "      return res.status(401).json({ error: 'Invalid email or password' });\n"
                "    }\n"
                "    const token = generateJWT(user.id);\n"
                "    return res.status(200).json({ token, message: 'Welcome back' });\n"
                "  } catch (err) {\n"
                "    return res.status(500).json({ error: 'Internal Server Error' });\n"
                "  }\n"
                "}"
            )
            explanation = "This is a basic login controller with parameter check, password comparison, and exception safety."
        else:
            code = (
                f"# Mock generated code for: {prompt}\n"
                f"# Language: {language} | Framework: {framework}\n\n"
                "def main():\n"
                "    print('Hello from CodeFlow AI Mock Service!')\n"
                "    # Your logic goes here\n\n"
                "if __name__ == '__main__':\n"
                "    main()"
            )
            explanation = f"Mock implementation generated based on language '{language}' and framework '{framework}'."

        return {
            "code": code,
            "explanation": explanation,
            "metrics": {
                "provider": "mock",
                "model": "mock-generator",
                "prompt_tokens": 30,
                "completion_tokens": 120,
                "cost": 0.0,
                "response_time_ms": 1000
            }
        }

    async def review_code(self, code: str, language: str) -> Dict[str, Any]:
        await asyncio.sleep(1.2)
        
        # Return structured analysis
        issues = [
            {
                "file_path": "main.py",
                "line_number": 5,
                "severity": "critical",
                "category": "security",
                "description": "Hardcoded database secret key detected in string literal.",
                "suggested_fix": "Move secret key to system environment variables using `os.getenv('DATABASE_KEY')`."
            },
            {
                "file_path": "main.py",
                "line_number": 12,
                "severity": "warning",
                "category": "performance",
                "description": "Unoptimized loop. Querying DB inside loop creates a N+1 query issue.",
                "suggested_fix": "Use SQL JOIN or bulk fetch queries to minimize DB hits."
            },
            {
                "file_path": "main.py",
                "line_number": 20,
                "severity": "info",
                "category": "smell",
                "description": "Variable 'temp_val' is declared but never referenced.",
                "suggested_fix": "Remove unused local variables to clean up workspace memory."
            }
        ]
        
        return {
            "score_overall": 72.0,
            "score_security": 55.0,
            "score_performance": 68.0,
            "score_readability": 85.0,
            "score_maintainability": 80.0,
            "issues": issues,
            "metrics": {
                "provider": "mock",
                "model": "mock-reviewer",
                "prompt_tokens": 150,
                "completion_tokens": 200,
                "cost": 0.0,
                "response_time_ms": 1200
            }
        }

    async def detect_bugs(self, code: str, language: str) -> Dict[str, Any]:
        await asyncio.sleep(0.8)
        
        bugs = [
            {
                "file_path": "index.js",
                "line_number": 8,
                "severity": "critical",
                "description": "Null pointer reference danger. Accessing property 'id' on potentially null 'user' object.",
                "suggested_fix": "Use optional chaining: `user?.id` or verify `if (user)` first."
            },
            {
                "file_path": "index.js",
                "line_number": 15,
                "severity": "warning",
                "description": "Implicit global variable declarations. Variable 'count' is instantiated without let, const, or var.",
                "suggested_fix": "Add 'let' keyword prefix: `let count = 0;`"
            }
        ]
        return {
            "bugs": bugs,
            "metrics": {
                "provider": "mock",
                "model": "mock-bug-scanner",
                "prompt_tokens": 100,
                "completion_tokens": 150,
                "cost": 0.0,
                "response_time_ms": 800
            }
        }

    async def generate_documentation(self, code: str, doc_type: str) -> Dict[str, Any]:
        await asyncio.sleep(1.0)
        
        doc_content = (
            f"# Generated Documentation ({doc_type})\n\n"
            "## Overview\n"
            "This document is automatically generated by CodeFlow AI to explain code blocks.\n\n"
            "## Components\n"
            "1. **Core API Actions**: Provides client mappings and exception filters.\n"
            "2. **State Contexts**: Subscribes parameters asynchronously.\n\n"
            "## Usage Guidelines\n"
            "```bash\n"
            "# Run local workspace tests\n"
            "npm run test\n"
            "```"
        )
        return {
            "documentation": doc_content,
            "metrics": {
                "provider": "mock",
                "model": "mock-documenter",
                "prompt_tokens": 80,
                "completion_tokens": 130,
                "cost": 0.0,
                "response_time_ms": 1000
            }
        }

    async def chat(self, messages: List[Dict[str, str]], system_prompt: str) -> Dict[str, Any]:
        await asyncio.sleep(0.5)
        last_user_message = messages[-1]["content"] if messages else "Hello"
        response_text = f"I received your message: '{last_user_message}'. I am running in local Mock Mode. Set your API Keys to unlock full Google Gemini, OpenAI, or Anthropic Claude intelligence."
        return {
            "message": response_text,
            "metrics": {
                "provider": "mock",
                "model": "mock-chat",
                "prompt_tokens": 50,
                "completion_tokens": 70,
                "cost": 0.0,
                "response_time_ms": 500
            }
        }

    async def chat_stream(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> AsyncGenerator[str, None]:
        last_user_message = messages[-1]["content"] if messages else "Hello"
        words = (
            f"This is a live streaming mock response to your request: '{last_user_message}'.\n\n"
            "Here is some mock python code for you:\n"
            "```python\n"
            "def hello_world():\n"
            "    print('Streaming from CodeFlow AI')\n"
            "```"
        ).split()
        
        for word in words:
            yield word + " "
            await asyncio.sleep(0.08)
