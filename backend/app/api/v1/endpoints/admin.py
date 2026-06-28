from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.core.deps import get_current_admin
from app.models.user import User
from app.models.workspace import Workspace, Project
from app.models.analytics import APIUsage, AuditLog
from app.schemas.analytics import AdminDashboardStats, AuditLogResponse
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/stats", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    total_users = db.query(User).count()
    total_workspaces = db.query(Workspace).count()
    total_projects = db.query(Project).count()
    
    usage_records = db.query(APIUsage).all()
    total_ai_requests = len(usage_records)
    total_estimated_cost = sum(r.estimated_cost for r in usage_records)
    
    # Provider Distribution
    prov_data = db.query(
        APIUsage.provider, func.count(APIUsage.id)
    ).group_by(APIUsage.provider).all()
    
    provider_distribution = {}
    for prov, count in prov_data:
        provider_distribution[prov] = count
        
    return {
        "total_users": total_users,
        "total_workspaces": total_workspaces,
        "total_projects": total_projects,
        "total_ai_requests": total_ai_requests,
        "total_estimated_cost": round(total_estimated_cost, 4),
        "provider_distribution": provider_distribution
    }

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: uuid.UUID,
    role: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if role not in ["ADMIN", "USER"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'ADMIN' or 'USER'.")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = role
    db.add(AuditLog(
        user_id=admin.id,
        action="admin_update_user_role",
        details=f"Updated role for user {user.email} to {role}."
    ))
    db.commit()
    db.refresh(user)
    return user

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
