import datetime
import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from pydantic import ConfigDict


class SystemHealthResponse(BaseModel):
    status: str
    db_connected: bool
    redis_connected: bool
    cpu_percent: float
    memory_percent: float
    platform: str
    version: str


class AdminDashboardStats(BaseModel):
    total_users: int
    total_workspaces: int
    total_projects: int
    total_ai_requests: int
    total_estimated_cost: float
    provider_distribution: Dict[str, int]


class AnalyticsResponse(BaseModel):
    total_requests: int
    estimated_cost: float
    language_distribution: Dict[str, int]
    action_distribution: Dict[str, int]
    daily_request_trend: List[Dict[str, Any]]


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime.datetime
