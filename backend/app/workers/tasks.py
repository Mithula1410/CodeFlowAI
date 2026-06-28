import logging
import threading
from typing import List, Dict, Any
import redis
from celery.exceptions import OperationalError
from app.workers.celery_app import celery_app
from app.core.config import settings
from app.core.websocket import manager
from app.database.session import SessionLocal
from app.models.review import CodeReview, ReviewIssue
from app.models.document import Document
from app.models.repository import GithubRepository
from app.models.notification import Notification
from app.models.analytics import APIUsage, UsageAnalytics
from app.ai.factory import get_ai_provider

logger = logging.getLogger("app")

# Redis connection checker
def is_redis_available() -> bool:
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=1)
        r.ping()
        return True
    except Exception:
        return False

# Local thread wrapper to run tasks if Celery is down
def run_locally_in_thread(func, *args, **kwargs):
    logger.info(f"Redis unavailable. Spawning local thread to run task: {func.__name__}")
    thread = threading.Thread(target=func, args=args, kwargs=kwargs)
    thread.daemon = True
    thread.start()

def execute_scan(project_id: str, repo_id: str, user_id: str):
    """Scan Github Repository code, perform review and notify client."""
    logger.info(f"Starting Scan for Repo {repo_id} under project {project_id}")
    db = SessionLocal()
    try:
        repo = db.query(GithubRepository).filter(GithubRepository.id == repo_id).first()
        if not repo:
            logger.error(f"Repository {repo_id} not found.")
            return
            
        # Simulate repository analysis or call mock reviewer
        ai_provider = get_ai_provider()
        
        # Simulated Code extraction
        code_block = (
            "def check_user(user_id):\n"
            "    user = db.execute('SELECT * FROM users WHERE id = ' + user_id) # SQL Injection\n"
            "    return user\n"
        )
        
        review_res = asyncio_run(ai_provider.review_code(code_block, "python"))
        
        # Save Code Review to DB
        review = CodeReview(
            project_id=project_id,
            score_overall=review_res.get("score_overall", 70.0),
            score_security=review_res.get("score_security", 70.0),
            score_performance=review_res.get("score_performance", 70.0),
            score_readability=review_res.get("score_readability", 70.0),
            score_maintainability=review_res.get("score_maintainability", 70.0),
        )
        db.add(review)
        db.flush()
        
        for issue_data in review_res.get("issues", []):
            issue = ReviewIssue(
                review_id=review.id,
                file_path=issue_data.get("file_path", "main.py"),
                line_number=issue_data.get("line_number", 1),
                severity=issue_data.get("severity", "warning"),
                category=issue_data.get("category", "smell"),
                description=issue_data.get("description", ""),
                suggested_fix=issue_data.get("suggested_fix", "")
            )
            db.add(issue)
            
        # Update repo scan stamp
        import datetime
        repo.last_scanned_at = datetime.datetime.utcnow()
        
        # Create user notification
        notif = Notification(
            user_id=user_id,
            title="Scan Completed",
            message=f"Scan for repository {repo.repo_name} completed with overall score {review.score_overall}%.",
            type="success"
        )
        db.add(notif)
        db.commit()
        
        # Trigger WebSocket update
        asyncio_run(manager.send_personal_message({
            "type": "NOTIFICATION",
            "title": notif.title,
            "message": notif.message,
            "style": notif.type
        }, user_id))
        
        asyncio_run(manager.send_personal_message({
            "type": "SCAN_COMPLETE",
            "project_id": project_id,
            "repo_id": repo_id,
            "score": review.score_overall
        }, user_id))
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error executing scan: {str(e)}")
        # Notify failure
        notif = Notification(
            user_id=user_id,
            title="Scan Failed",
            message=f"Failed to scan repository: {str(e)}",
            type="error"
        )
        db.add(notif)
        db.commit()
        asyncio_run(manager.send_personal_message({
            "type": "NOTIFICATION",
            "title": notif.title,
            "message": notif.message,
            "style": notif.type
        }, user_id))
    finally:
        db.close()

def execute_review(project_id: str, user_id: str, file_path: str, code: str, language: str):
    """Perform code review analysis and notify user."""
    logger.info(f"Starting review for project {project_id}, file {file_path}")
    db = SessionLocal()
    try:
        ai_provider = get_ai_provider()
        review_res = asyncio_run(ai_provider.review_code(code, language))
        
        review = CodeReview(
            project_id=project_id,
            score_overall=review_res.get("score_overall", 70.0),
            score_security=review_res.get("score_security", 70.0),
            score_performance=review_res.get("score_performance", 70.0),
            score_readability=review_res.get("score_readability", 70.0),
            score_maintainability=review_res.get("score_maintainability", 70.0),
        )
        db.add(review)
        db.flush()
        
        for issue_data in review_res.get("issues", []):
            issue = ReviewIssue(
                review_id=review.id,
                file_path=file_path,
                line_number=issue_data.get("line_number", 1),
                severity=issue_data.get("severity", "warning"),
                category=issue_data.get("category", "smell"),
                description=issue_data.get("description", ""),
                suggested_fix=issue_data.get("suggested_fix", "")
            )
            db.add(issue)
            
        metrics = review_res.get("metrics", {})
        if metrics:
            db.add(APIUsage(
                user_id=user_id,
                provider=metrics.get("provider", "mock"),
                model=metrics.get("model", "mock-reviewer"),
                prompt_tokens=metrics.get("prompt_tokens", 0),
                completion_tokens=metrics.get("completion_tokens", 0),
                estimated_cost=metrics.get("cost", 0.0),
                response_time_ms=metrics.get("response_time_ms", 0)
            ))
            
        db.add(UsageAnalytics(user_id=user_id, action_type="review", language=language))
        
        notif = Notification(
            user_id=user_id,
            title="Code Review Complete",
            message=f"Review for {file_path} completed successfully.",
            type="success"
        )
        db.add(notif)
        db.commit()
        
        asyncio_run(manager.send_personal_message({
            "type": "NOTIFICATION",
            "title": notif.title,
            "message": notif.message,
            "style": notif.type
        }, user_id))
        
        asyncio_run(manager.send_personal_message({
            "type": "REVIEW_COMPLETE",
            "project_id": project_id,
            "score": review.score_overall
        }, user_id))
    except Exception as e:
        db.rollback()
        logger.error(f"Error reviewing code: {str(e)}")
        notif = Notification(
            user_id=user_id,
            title="Code Review Failed",
            message=str(e),
            type="error"
        )
        db.add(notif)
        db.commit()
        asyncio_run(manager.send_personal_message({
            "type": "NOTIFICATION",
            "title": notif.title,
            "message": notif.message,
            "style": notif.type
        }, user_id))
    finally:
        db.close()

# Helper to execute async methods synchronously in worker threads
def asyncio_run(coro):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

# Celery Task Wrappers
@celery_app.task
def scan_repository_task(project_id: str, repo_id: str, user_id: str):
    execute_scan(project_id, repo_id, user_id)

@celery_app.task
def review_code_task(project_id: str, user_id: str, file_path: str, code: str, language: str):
    execute_review(project_id, user_id, file_path, code, language)

# Dispatch helper
def dispatch_scan_repository(project_id: str, repo_id: str, user_id: str):
    if is_redis_available():
        try:
            scan_repository_task.delay(project_id, repo_id, user_id)
            return
        except OperationalError:
            pass
    run_locally_in_thread(execute_scan, project_id, repo_id, user_id)

def dispatch_review_code(project_id: str, user_id: str, file_path: str, code: str, language: str):
    if is_redis_available():
        try:
            review_code_task.delay(project_id, user_id, file_path, code, language)
            return
        except OperationalError:
            pass
    run_locally_in_thread(execute_review, project_id, user_id, file_path, code, language)
