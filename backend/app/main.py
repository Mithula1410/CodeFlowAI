import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging_config import logger, setup_logging
from app.database.session import SessionLocal
from app.database.init_db import init_db
from app.api.v1.router import api_router
from app.middleware.rate_limit import RateLimitMiddleware

# Setup logger before initiating application
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Apply token-bucket Rate Limiter
app.add_middleware(RateLimitMiddleware)

# Apply Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    t0 = time.time()
    response = await call_next(request)
    
    # Inject security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Log access request logs
    latency_ms = int((time.time() - t0) * 1000)
    access_log = f"{request.client.host if request.client else 'unknown'} - \"{request.method} {request.url.path}\" {response.status_code} - {latency_ms}ms"
    
    # Retrieve access logger
    import logging
    logging.getLogger("access").info(access_log)
    
    return response

# Register v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Initialize database schemas on startup
@app.on_event("startup")
def startup_event():
    logger.info("Starting up CodeFlow AI Backend Server...")
    db = SessionLocal()
    try:
        init_db(db)
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs"
    }
