from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workspace import Project, Workspace
from app.models.repository import GithubRepository
from app.models.analytics import AuditLog
from app.workers.tasks import dispatch_scan_repository

router = APIRouter()

@router.get("/repos", response_model=List[dict])
def list_repositories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Returns all repositories linked to the user's projects
    repos = db.query(GithubRepository).join(Project).join(Workspace).filter(
        Workspace.owner_id == current_user.id
    ).all()
    
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "repo_name": r.repo_name,
            "owner": r.owner,
            "html_url": r.html_url,
            "is_connected": r.is_connected,
            "last_scanned_at": r.last_scanned_at,
            "created_at": r.created_at
        } for r in repos
    ]

@router.post("/connect", status_code=status.HTTP_201_CREATED)
def connect_repository(
    workspace_id: uuid.UUID,
    repo_name: str,
    owner: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify Workspace
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    # Auto-create a Project for this Repository
    project = Project(
        workspace_id=workspace.id,
        name=f"Repo: {repo_name}",
        description=f"Automated CodeFlow AI Project for Github repository {owner}/{repo_name}"
    )
    db.add(project)
    db.flush()
    
    # Create GithubRepository record
    repo = GithubRepository(
        project_id=project.id,
        repo_name=repo_name,
        owner=owner,
        html_url=f"https://github.com/{owner}/{repo_name}",
        is_connected=True
    )
    db.add(repo)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="connect_github_repo",
        details=f"Connected repository {owner}/{repo_name} to project ID: {project.id}"
    ))
    db.commit()
    
    return {
        "message": "Repository linked successfully",
        "project_id": project.id,
        "repo_id": repo.id
    }

@router.post("/review/{repo_id}")
def trigger_repo_review(
    repo_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify ownership of repo's project
    repo = db.query(GithubRepository).join(Project).join(Workspace).filter(
        GithubRepository.id == repo_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Connected repository not found.")
        
    # Dispatch Background scan
    dispatch_scan_repository(repo.project_id, repo.id, current_user.id)
    
    return {
        "message": "Background scanning and review dispatched successfully. You will receive real-time notifications once complete."
    }
