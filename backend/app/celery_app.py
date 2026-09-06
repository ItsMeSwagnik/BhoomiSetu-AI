from celery import Celery
from app.config import settings

celery_app = Celery("bhoomisetu", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_max_retries=2,
)
