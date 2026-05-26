from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core import deps
from app.models.models import Meeting, User, UserRole
from app.schemas.schemas import MeetingCreate, MeetingResponse
from app.workers.tasks import extract_meeting_action_items_task

router = APIRouter()

@router.post("/", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    meeting_in: MeetingCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    meeting = Meeting(
        title=meeting_in.title,
        transcript=meeting_in.transcript,
        summary="Processing transcript in background..."
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    try:
        # Dispatch Celery background worker task asynchronously!
        # This keeps the API response instantaneous and avoids blocking request threads.
        extract_meeting_action_items_task.delay(meeting.id)
    except Exception as e:
        print(f"Celery dispatch failed: {str(e)}. Running task synchronously as fallback.")
        # Graceful fallback to inline execution if Celery is offline
        extract_meeting_action_items_task(meeting.id)
        
    db.refresh(meeting)
    return meeting

@router.get("/", response_model=List[MeetingResponse])
def list_meetings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return db.query(Meeting).order_by(Meeting.created_at.desc()).all()

@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting transcript record not found.")
    return meeting

@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
        
    if current_user.role not in [UserRole.ADMIN, UserRole.COORDINATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins or Coordinators can delete meeting memory records."
        )
        
    db.delete(meeting)
    db.commit()
    return None
