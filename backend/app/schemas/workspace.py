import datetime
import uuid
from typing import Optional, List
from pydantic import BaseModel
from pydantic import ConfigDict


# File Schemas
class FileCreate(BaseModel):
    path: str
    content: str = ""
    language: str = "javascript"


class FileUpdate(BaseModel):
    content: str


class FileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    path: str
    content: str
    language: str
    updated_at: datetime.datetime


# Project Schemas
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: Optional[str] = None
    created_at: datetime.datetime
    files: List[FileResponse] = []


# Workspace Schemas
class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: Optional[str] = None
    created_at: datetime.datetime
    projects: List[ProjectResponse] = []
