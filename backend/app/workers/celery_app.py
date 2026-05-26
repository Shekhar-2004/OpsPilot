import os
from celery import Celery

# Load db connection from env or defaults
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://shekhar15@localhost:5433/opspilot"
)

# Convert postgresql:// to sqla+postgresql:// for Celery broker compatibility
broker_url = DATABASE_URL.replace("postgresql://", "sqla+postgresql://")
result_backend = "db+" + DATABASE_URL

celery_app = Celery(
    "opspilot_worker",
    broker=broker_url,
    backend=result_backend
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    # Configure SQLAlchemy broker specific settings
    broker_transport_options={
        "polling_interval": 2.0  # seconds
    }
)

# Autodiscover tasks
celery_app.autodiscover_tasks(["app.workers"])
