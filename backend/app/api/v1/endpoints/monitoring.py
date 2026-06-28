import psutil
import platform
from sqlalchemy import text
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.workers.tasks import is_redis_available
from app.schemas.analytics import SystemHealthResponse

router = APIRouter()

@router.get("/health", response_model=SystemHealthResponse)
def health_check(db: Session = Depends(get_db)):
    # Check DB Connection
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        pass
            
    # Check Redis
    redis_connected = is_redis_available()
    
    # Get Resource Telemetry
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    
    # Set overall status
    status = "healthy"
    if not db_connected:
        status = "degraded"
        
    return {
        "status": status,
        "db_connected": db_connected,
        "redis_connected": redis_connected,
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "platform": f"{platform.system()} {platform.release()}",
        "version": settings.VERSION
    }

@router.get("/metrics")
def get_prometheus_metrics(db: Session = Depends(get_db)):
    # Basic Prometheus Metrics formatting
    redis_status = 1 if is_redis_available() else 0
    cpu = psutil.cpu_percent()
    mem = psutil.virtual_memory().percent
    
    metrics = (
        f"# HELP codeflow_cpu_usage Host CPU usage percent\n"
        f"# TYPE codeflow_cpu_usage gauge\n"
        f"codeflow_cpu_usage {cpu}\n"
        f"# HELP codeflow_memory_usage Host Memory usage percent\n"
        f"# TYPE codeflow_memory_usage gauge\n"
        f"codeflow_memory_usage {mem}\n"
        f"# HELP codeflow_redis_up Redis connection status\n"
        f"# TYPE codeflow_redis_up gauge\n"
        f"codeflow_redis_up {redis_status}\n"
    )
    from fastapi import Response
    return Response(content=metrics, media_type="text/plain")

@router.get("/system")
def get_system_telemetry():
    return {
        "cpu_cores": psutil.cpu_count(logical=True),
        "cpu_frequency_mhz": psutil.cpu_freq().current if psutil.cpu_freq() else "unknown",
        "memory_total_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
        "disk_free_gb": round(psutil.disk_usage('/').free / (1024 ** 3), 2)
    }
