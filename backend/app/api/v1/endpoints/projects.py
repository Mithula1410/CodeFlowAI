from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workspace import Workspace, Project
from app.models.analytics import AuditLog
from app.schemas.workspace import ProjectCreate, ProjectResponse

router = APIRouter()


@router.get("/workspace/{workspace_id}", response_model=List[ProjectResponse])
def get_projects(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all projects inside a workspace."""
    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return workspace.projects


@router.post(
    "/workspace/{workspace_id}",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    workspace_id: uuid.UUID,
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new project inside a workspace."""
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    project = Project(
        workspace_id=workspace.id,
        name=project_in.name,
        description=project_in.description,
    )
    db.add(project)
    db.flush()

    db.add(
        AuditLog(
            user_id=current_user.id,
            action="create_project",
            details=f"Created project '{project.name}' (ID: {project.id}) in workspace '{workspace.name}'",
        )
    )
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a project and all its files, chats, and reviews."""
    project = (
        db.query(Project)
        .join(Workspace)
        .filter(Project.id == project_id, Workspace.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    db.delete(project)
    db.add(
        AuditLog(
            user_id=current_user.id,
            action="delete_project",
            details=f"Deleted project (ID: {project_id})",
        )
    )
    db.commit()
    return None
