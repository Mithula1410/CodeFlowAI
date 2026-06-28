import datetime
import uuid
from typing import Optional, List
from pydantic import BaseModel

# File Schemas
class FileCreate(BaseModel):
    path: str
    content: str = ""
    language: str = "javascript"

class FileUpdate(BaseModel):
    content: str

class FileResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    path: str
    content: str
    language: str
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Project Schemas
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: Optional[str] = None
    created_at: datetime.datetime
    files: List[FileResponse] = []

    class Config:
        from_attributes = True

# Workspace Schemas
class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: Optional[str] = None
    created_at: datetime.datetime
    projects: List[ProjectResponse] = []

    class Config:
        from_attributes = True
