import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workspace import Project, Workspace
from app.models.chat import Chat, ChatMessage
from app.models.analytics import APIUsage, UsageAnalytics
from app.schemas.ai import ChatRequest, ChatMessageSchema
from app.ai.factory import get_ai_provider

router = APIRouter()


@router.get("/project/{project_id}", response_model=List[dict])
def list_chats(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all chat sessions for a project."""
    project = (
        db.query(Project)
        .join(Workspace)
        .filter(Project.id == project_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return [
        {
            "id": str(chat.id),
            "title": chat.title,
            "created_at": chat.created_at.isoformat(),
            "message_count": len(chat.messages),
        }
        for chat in project.chats
    ]


@router.post("/project/{project_id}", response_model=dict)
def create_chat(
    project_id: uuid.UUID,
    title: str = "New Chat",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new chat session under a project."""
    project = (
        db.query(Project)
        .join(Workspace)
        .filter(Project.id == project_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    chat = Chat(project_id=project_id, title=title)
    db.add(chat)
    db.commit()
    db.refresh(chat)

    return {"id": str(chat.id), "title": chat.title, "created_at": chat.created_at.isoformat()}


@router.get("/{chat_id}/messages", response_model=List[dict])
def get_chat_messages(
    chat_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve all messages from a chat session."""
    chat = (
        db.query(Chat)
        .join(Project)
        .join(Workspace)
        .filter(Chat.id == chat_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return [
        {
            "id": str(msg.id),
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }
        for msg in chat.messages
    ]


@router.post("/{chat_id}/message", response_model=dict)
async def send_chat_message(
    chat_id: uuid.UUID,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Send a message and receive a full (non-streaming) AI response. 
    For streaming, use the WebSocket /ws endpoint."""
    chat = (
        db.query(Chat)
        .join(Project)
        .join(Workspace)
        .filter(Chat.id == chat_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Save user message
    last_user_msg = payload.messages[-1]
    user_db_msg = ChatMessage(
        chat_id=chat_id, role=last_user_msg.role, content=last_user_msg.content
    )
    db.add(user_db_msg)

    # Call AI
    provider = get_ai_provider(payload.provider)
    history = [{"role": m.role, "content": m.content} for m in payload.messages]
    result = await provider.chat(history, "You are a helpful software engineering assistant.")

    # Save assistant response
    assistant_msg = ChatMessage(chat_id=chat_id, role="assistant", content=result["message"])
    db.add(assistant_msg)

    # Log analytics
    metrics = result.get("metrics", {})
    if metrics:
        db.add(
            APIUsage(
                user_id=current_user.id,
                provider=metrics.get("provider", "mock"),
                model=metrics.get("model", "mock-chat"),
                prompt_tokens=metrics.get("prompt_tokens", 0),
                completion_tokens=metrics.get("completion_tokens", 0),
                estimated_cost=metrics.get("cost", 0.0),
                response_time_ms=metrics.get("response_time_ms", 0),
            )
        )
    db.add(UsageAnalytics(user_id=current_user.id, action_type="chat"))
    db.commit()

    return {"message": result["message"], "metrics": metrics}


@router.delete("/{chat_id}", status_code=204)
def delete_chat(
    chat_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a chat session and all messages."""
    chat = (
        db.query(Chat)
        .join(Project)
        .join(Workspace)
        .filter(Chat.id == chat_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    db.delete(chat)
    db.commit()
    return None
