from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, teams, tasks, docs, query, meetings
from app.models.database import engine, Base

# Recreate / verify tables are fully loaded in Postgres
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS rules for premium interactive client communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(teams.router, prefix=f"{settings.API_V1_STR}/teams", tags=["Teams"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
app.include_router(docs.router, prefix=f"{settings.API_V1_STR}/docs", tags=["Document Intelligence"])
app.include_router(query.router, prefix=f"{settings.API_V1_STR}/query", tags=["AI Query Interface"])
app.include_router(meetings.router, prefix=f"{settings.API_V1_STR}/meetings", tags=["Meeting Intelligence"])

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "OpsPilot Gateway API",
        "version": "1.0.0-phase1-mvp"
    }
