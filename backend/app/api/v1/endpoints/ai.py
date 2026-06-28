from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.analytics import APIUsage, UsageAnalytics
from app.schemas.ai import (
    CodeGenerateRequest,
    CodeGenerateResponse,
    DocumentationRequest,
    DocumentationResponse,
    CodeReviewResponse
)
from app.ai.factory import get_ai_provider

router = APIRouter()

@router.post("/generate", response_model=CodeGenerateResponse)
async def generate_code(
    payload: CodeGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # Get provider from factory
        provider = get_ai_provider(payload.provider)
        
        result = await provider.generate_code(
            prompt=payload.prompt,
            language=payload.language,
            framework=payload.framework,
            temperature=payload.temperature
        )
        
        # Log analytics
        metrics = result.get("metrics", {})
        if metrics:
            db.add(APIUsage(
                user_id=current_user.id,
                provider=metrics.get("provider", "mock"),
                model=metrics.get("model", "mock-model"),
                prompt_tokens=metrics.get("prompt_tokens", 0),
                completion_tokens=metrics.get("completion_tokens", 0),
                estimated_cost=metrics.get("cost", 0.0),
                response_time_ms=metrics.get("response_time_ms", 0)
            ))
        db.add(UsageAnalytics(
            user_id=current_user.id,
            action_type="generate",
            language=payload.language
        ))
        db.commit()
        
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Code Generation Error: {str(e)}"
        )

@router.post("/review", response_model=CodeReviewResponse)
async def review_code(
    code: str,
    language: str = "python",
    provider: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        ai_provider = get_ai_provider(provider)
        result = await ai_provider.review_code(code, language)
        
        metrics = result.get("metrics", {})
        if metrics:
            db.add(APIUsage(
                user_id=current_user.id,
                provider=metrics.get("provider", "mock"),
                model=metrics.get("model", "mock-reviewer"),
                prompt_tokens=metrics.get("prompt_tokens", 0),
                completion_tokens=metrics.get("completion_tokens", 0),
                estimated_cost=metrics.get("cost", 0.0),
                response_time_ms=metrics.get("response_time_ms", 0)
            ))
        db.add(UsageAnalytics(
            user_id=current_user.id,
            action_type="review",
            language=language
        ))
        db.commit()
        
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"AI Code Review Error: {str(e)}"
        )

@router.post("/documentation", response_model=DocumentationResponse)
async def generate_docs(
    payload: DocumentationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        provider = get_ai_provider(payload.provider)
        result = await provider.generate_documentation(payload.code, payload.doc_type)
        
        metrics = result.get("metrics", {})
        if metrics:
            db.add(APIUsage(
                user_id=current_user.id,
                provider=metrics.get("provider", "mock"),
                model=metrics.get("model", "mock-documenter"),
                prompt_tokens=metrics.get("prompt_tokens", 0),
                completion_tokens=metrics.get("completion_tokens", 0),
                estimated_cost=metrics.get("cost", 0.0),
                response_time_ms=metrics.get("response_time_ms", 0)
            ))
        db.add(UsageAnalytics(
            user_id=current_user.id,
            action_type="documentation",
            language="any"
        ))
        db.commit()
        
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"AI Documentation Error: {str(e)}"
        )
