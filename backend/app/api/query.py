from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import deps
from app.schemas.schemas import QueryRequest, QueryResponse
from app.services.ai_service import AIService
from app.models.models import User

router = APIRouter()

@router.post("/", response_model=QueryResponse)
def execute_query(
    query_in: QueryRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    try:
        res = AIService.answer_query(
            db=db,
            query=query_in.query,
            team_id=query_in.team_id
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while executing operational AI query: {str(e)}"
        )
