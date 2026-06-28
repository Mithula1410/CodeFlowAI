import time
from typing import Dict, Tuple
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from app.core.config import settings

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # Store IP/User ID mapped to (tokens_count, last_updated_timestamp)
        self.buckets: Dict[str, Tuple[float, float]] = {}
        self.rate = settings.RATE_LIMIT_REQUESTS / settings.RATE_LIMIT_WINDOW_SECONDS
        self.capacity = settings.RATE_LIMIT_REQUESTS

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Bypass rate limit for docs, health endpoints
        path = request.url.path
        if path.startswith("/docs") or path.startswith("/redoc") or "health" in path or "metrics" in path or "system" in path:
            return await call_next(request)

        # Identify client by IP
        client_ip = request.client.host if request.client else "unknown"
        
        now = time.time()
        tokens, last_update = self.buckets.get(client_ip, (self.capacity, now))

        # Replenish tokens
        elapsed = now - last_update
        tokens = min(self.capacity, tokens + elapsed * self.rate)
        self.buckets[client_ip] = (tokens, now)

        if tokens < 1.0:
            # Out of tokens, return HTTP 429
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please try again later."}
            )

        # Consume 1 token
        self.buckets[client_ip] = (tokens - 1.0, now)
        return await call_next(request)
