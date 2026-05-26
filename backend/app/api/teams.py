import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core import deps
from app.models.models import Team, User, UserRole
from app.schemas.schemas import TeamCreate, TeamResponse, TeamDetailResponse, AddTeamMemberRequest, JoinTeamRequest

router = APIRouter()

@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_in: TeamCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Only Admin or Coordinator can create teams
    if current_user.role not in [UserRole.ADMIN, UserRole.COORDINATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins or Coordinators can create teams."
        )
        
    existing_team = db.query(Team).filter(Team.name == team_in.name).first()
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team with this name already exists."
        )
        
    # Generate unique 6-character alphanumeric invite code
    invite_code = secrets.token_hex(3)
    while db.query(Team).filter(Team.invite_code == invite_code).first():
        invite_code = secrets.token_hex(3)
        
    team = Team(name=team_in.name, description=team_in.description, invite_code=invite_code)
    team.members.append(current_user)  # Creator automatically becomes member
    db.add(team)
    db.commit()
    db.refresh(team)
    return team

@router.get("/", response_model=List[TeamResponse])
def get_user_teams(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Return teams that the user is a member of (or all if admin)
    if current_user.role == UserRole.ADMIN:
        return db.query(Team).all()
    return current_user.teams

@router.get("/{team_id}", response_model=TeamDetailResponse)
def get_team(
    team_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
        
    # Check membership
    if current_user.role != UserRole.ADMIN and current_user not in team.members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. You are not a member of this team."
        )
    return team

@router.post("/{team_id}/members", response_model=TeamDetailResponse)
def add_team_member(
    team_id: int,
    member_in: AddTeamMemberRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
        
    # Only Admin or Coordinator who is a member can add users
    if current_user.role not in [UserRole.ADMIN, UserRole.COORDINATOR] or (current_user not in team.members and current_user.role != UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to add members to this team."
        )
        
    user_to_add = db.query(User).filter(User.email == member_in.email).first()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {member_in.email} not found."
        )
        
    if user_to_add in team.members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this team."
        )
        
    team.members.append(user_to_add)
    db.commit()
    db.refresh(team)
    return team

@router.post("/join", response_model=TeamDetailResponse)
def join_team(
    join_in: JoinTeamRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    team = db.query(Team).filter(Team.invite_code == join_in.invite_code.strip()).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid team invite code. Please verify the code and try again."
        )
        
    if current_user in team.members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this team."
        )
        
    team.members.append(current_user)
    db.commit()
    db.refresh(team)
    return team
