import json
import logging
from typing import Dict, List
from fastapi import WebSocket, status
from app.core.security import decode_token

logger = logging.getLogger("app")

class ConnectionManager:
    def __init__(self):
        # Map user_id (string) to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, token: str) -> str:
        """Accepts connection, decodes token, returns authenticated user_id or raises error."""
        await websocket.accept()
        
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            logger.warning("Rejected WebSocket handshake: Invalid JWT token.")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError("Authentication failed")
            
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("Rejected WebSocket handshake: Missing user ID.")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError("Authentication failed")
            
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user: {user_id}")
        return user_id

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user: {user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            connections = self.active_connections[user_id]
            for connection in list(connections):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending WebSocket message to user {user_id}: {str(e)}")
                    # Safe removal
                    if connection in self.active_connections[user_id]:
                        self.active_connections[user_id].remove(connection)

    async def broadcast(self, message: dict):
        for user_id, connections in list(self.active_connections.items()):
            for connection in list(connections):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting WebSocket message to connection: {str(e)}")
                    if connection in self.active_connections[user_id]:
                        self.active_connections[user_id].remove(connection)

manager = ConnectionManager()
