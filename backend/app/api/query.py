from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core import deps
from app.core.config import settings
from app.core.rate_limit import ai_minute_limiter, ai_day_limiter
from app.schemas.schemas import QueryRequest, QueryResponse
from app.services.ai_service import AIService
from app.models.models import User

router = APIRouter()

@router.post("/", response_model=QueryResponse)
def execute_query(
    query_in: QueryRequest,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # 1. Enforce query length limits to prevent prompt injection or token flooding
    if len(query_in.query) > settings.MAX_QUERY_CHAR_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Query size exceeds maximum allowed limit of {settings.MAX_QUERY_CHAR_LIMIT} characters."
        )

    # 2. Extract rate limit key (primarily using authenticated User ID, falling back to Client IP)
    limiter_key = f"user_{current_user.id}" if current_user else f"ip_{request.client.host}"

    # 3. Apply Sliding Window Rate Limiting (Short-Term: per minute, Long-Term: per day)
    ai_minute_limiter.check_rate_limit(
        key=limiter_key,
        max_requests=settings.AI_LIMIT_PER_MINUTE,
        window_seconds=60
    )
    ai_day_limiter.check_rate_limit(
        key=limiter_key,
        max_requests=settings.AI_LIMIT_PER_DAY,
        window_seconds=86400
    )

    try:
        res = AIService.answer_query(
            db=db,
            query=query_in.query,
            team_id=query_in.team_id,
            current_user=current_user
        )
        return res
    except HTTPException as he:
        # Keep FastAPI raised exceptions
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while executing operational AI query: {str(e)}"
        )
