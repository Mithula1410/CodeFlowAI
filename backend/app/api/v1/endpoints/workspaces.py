from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.analytics import AuditLog
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse, WorkspaceUpdate

router = APIRouter()

@router.get("/", response_model=List[WorkspaceResponse])
def get_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Workspace).filter(Workspace.owner_id == current_user.id).all()

@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    workspace_in: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    workspace = Workspace(
        owner_id=current_user.id,
        name=workspace_in.name,
        description=workspace_in.description
    )
    db.add(workspace)
    db.flush()
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="create_workspace",
        details=f"Created workspace '{workspace.name}' (ID: {workspace.id})"
    ))
    db.commit()
    db.refresh(workspace)
    return workspace

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace_by_id(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    return workspace

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(
    workspace_id: uuid.UUID,
    workspace_in: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
        
    if workspace_in.name is not None:
        workspace.name = workspace_in.name
    if workspace_in.description is not None:
        workspace.description = workspace_in.description
        
    db.add(AuditLog(
        user_id=current_user.id,
        action="update_workspace",
        details=f"Updated workspace '{workspace.name}' (ID: {workspace.id})"
    ))
    db.commit()
    db.refresh(workspace)
    return workspace

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
        
    db.delete(workspace)
    db.add(AuditLog(
        user_id=current_user.id,
        action="delete_workspace",
        details=f"Deleted workspace '{workspace.name}' (ID: {workspace_id})"
    ))
    db.commit()
    return None
