from celery import Celery
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "codeflow_workers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=1800,  # 30 minutes max
)

# Automatically autodiscover tasks from workers
celery_app.autodiscover_tasks(["app.workers"])
