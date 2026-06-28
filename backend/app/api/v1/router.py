from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    workspaces,
    projects,
    files,
    ai,
    chat,
    websocket_routes,
    github,
    analytics,
    admin,
    monitoring,
)

api_router = APIRouter()

# Include HTTP Endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["Workspaces"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Engine"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Chat Sessions"])
api_router.include_router(github.router, prefix="/github", tags=["Github Connect"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoring & Diagnostics"])

# Include WebSocket Route
api_router.include_router(websocket_routes.router, tags=["WebSocket System"])
