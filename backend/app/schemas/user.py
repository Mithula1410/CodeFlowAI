import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from pydantic import ConfigDict


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="User password must be at least 6 characters.")
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime.datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str
