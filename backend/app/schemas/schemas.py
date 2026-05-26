from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from app.models.models import UserRole, TaskPriority, TaskStatus

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Team Schemas
class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: int
    invite_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class JoinTeamRequest(BaseModel):
    invite_code: str

class TeamDetailResponse(TeamResponse):
    members: List[UserResponse] = []

    class Config:
        from_attributes = True

class AddTeamMemberRequest(BaseModel):
    email: EmailStr

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    deadline: Optional[str] = None

class TaskCreate(TaskBase):
    team_id: int
    owner_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    deadline: Optional[str] = None
    owner_id: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    team_id: int
    owner_id: Optional[int] = None
    owner: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    file_name: str
    uploaded_by: str
    team_id: int
    embedding_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# Query Schemas
class QueryRequest(BaseModel):
    query: str
    team_id: Optional[int] = None

class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[str] = []
    extracted_tasks: List[dict] = []

# Meeting Schemas
class MeetingCreate(BaseModel):
    title: str
    transcript: str

class MeetingResponse(BaseModel):
    id: int
    title: str
    transcript: str
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
