from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core import deps
from app.models.models import Task, Team, User, UserRole, TaskStatus, TaskPriority
from app.schemas.schemas import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    team = db.query(Team).filter(Team.id == task_in.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
        
    # Check membership
    if current_user not in team.members and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team."
        )
        
    # Verify owner_id exists and is in the team
    owner_id = task_in.owner_id
    if owner_id:
        owner = db.query(User).filter(User.id == owner_id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Assigned owner not found.")
        if owner not in team.members and owner.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned owner must be a member of the team."
            )
            
    task = Task(
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority,
        status=task_in.status,
        deadline=task_in.deadline,
        team_id=task_in.team_id,
        owner_id=owner_id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    team_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(Task)
    
    if team_id:
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found.")
        if current_user not in team.members and current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied.")
        query = query.filter(Task.team_id == team_id)
    else:
        # Default to listing user's teams' tasks if not admin
        if current_user.role != UserRole.ADMIN:
            user_team_ids = [t.id for t in current_user.teams]
            query = query.filter(Task.team_id.in_(user_team_ids))
            
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
        
    return query.all()

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    # Check authorization
    if current_user.role != UserRole.ADMIN and current_user not in task.team.members:
        raise HTTPException(status_code=403, detail="Access denied.")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    # Check membership
    if current_user.role != UserRole.ADMIN and current_user not in task.team.members:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    update_data = task_in.model_dump(exclude_unset=True)
    
    if "owner_id" in update_data and update_data["owner_id"] is not None:
        owner = db.query(User).filter(User.id == update_data["owner_id"]).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Assigned owner not found.")
        if owner not in task.team.members and owner.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned owner must be a member of the team."
            )
            
    for key, value in update_data.items():
        setattr(task, key, value)
        
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    # Coordinator or Admin required to delete
    if current_user.role not in [UserRole.ADMIN, UserRole.COORDINATOR] or (current_user not in task.team.members and current_user.role != UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins or Coordinators of the team can delete tasks."
        )
        
    db.delete(task)
    db.commit()
    return None
