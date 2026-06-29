from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Core AI Metrics Schema
class AIMetrics(BaseModel):
    provider: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    cost: float
    response_time_ms: int

# Code Generation
class CodeGenerateRequest(BaseModel):
    prompt: str
    language: str = "python"
    framework: str = "vanilla"
    temperature: float = 0.7
    provider: Optional[str] = None
    model: Optional[str] = None

class CodeGenerateResponse(BaseModel):
    code: str
    explanation: str
    metrics: Optional[AIMetrics] = None

# Code Review
class CodeReviewRequest(BaseModel):
    code: str
    language: str = "python"
    provider: Optional[str] = None

class ReviewIssueDetail(BaseModel):
    file_path: str
    line_number: int
    severity: str
    category: str
    description: str
    suggested_fix: Optional[str] = None

class CodeReviewResponse(BaseModel):
    score_overall: float
    score_security: float
    score_performance: float
    score_readability: float
    score_maintainability: float
    issues: List[ReviewIssueDetail]
    metrics: Optional[AIMetrics] = None

# Bug Detection
class BugDetail(BaseModel):
    file_path: str
    line_number: int
    severity: str
    description: str
    suggested_fix: Optional[str] = None

class BugDetectionResponse(BaseModel):
    bugs: List[BugDetail]
    metrics: Optional[AIMetrics] = None

# Documentation
class DocumentationRequest(BaseModel):
    code: str
    doc_type: str = "README"  # "README", "API_DOCS", "INLINE"
    provider: Optional[str] = None

class DocumentationResponse(BaseModel):
    documentation: str
    metrics: Optional[AIMetrics] = None

# Chat
class ChatMessageSchema(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessageSchema]
    provider: Optional[str] = None
    model: Optional[str] = None
