import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.websocket import manager
from app.ai.factory import get_ai_provider

router = APIRouter()
logger = logging.getLogger("app")

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    user_id = None
    try:
        user_id = await manager.connect(websocket, token)
    except ValueError:
        # Auth failed and socket was closed
        return

    try:
        while True:
            # Receive text data
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "ERROR",
                    "message": "Invalid JSON format payload"
                }))
                continue
                
            msg_type = payload.get("type")
            
            if msg_type == "CHAT":
                # Chat message payload: {"type": "CHAT", "messages": [...], "provider": "mock"}
                history = payload.get("messages", [])
                provider_name = payload.get("provider", "mock")
                
                try:
                    # Notify typing
                    await websocket.send_text(json.dumps({
                        "type": "TYPING",
                        "status": True
                    }))
                    
                    ai_provider = get_ai_provider(provider_name)
                    
                    # Stream response
                    async for chunk in ai_provider.chat_stream(history, "You are a helpful software engineering assistant."):
                        await websocket.send_text(json.dumps({
                            "type": "CHAT_CHUNK",
                            "chunk": chunk
                        }))
                        
                    # Notify typing finished
                    await websocket.send_text(json.dumps({
                        "type": "TYPING",
                        "status": False
                    }))
                except Exception as e:
                    logger.error(f"WebSocket Chat error: {str(e)}")
                    await websocket.send_text(json.dumps({
                        "type": "ERROR",
                        "message": f"Chat failure: {str(e)}"
                    }))
                    
            elif msg_type == "CODE_GEN":
                # Code generation streaming
                prompt = payload.get("prompt", "")
                provider_name = payload.get("provider", "mock")
                
                try:
                    await websocket.send_text(json.dumps({
                        "type": "TYPING",
                        "status": True
                    }))
                    
                    ai_provider = get_ai_provider(provider_name)
                    # Simulated prompt for chat stream that returns code format
                    messages = [{"role": "user", "content": f"Generate code for: {prompt}. Return only code block."}]
                    
                    async for chunk in ai_provider.chat_stream(messages, "Generate clean formatted code."):
                        await websocket.send_text(json.dumps({
                            "type": "CODE_GEN_CHUNK",
                            "chunk": chunk
                        }))
                        
                    await websocket.send_text(json.dumps({
                        "type": "TYPING",
                        "status": False
                    }))
                except Exception as e:
                    await websocket.send_text(json.dumps({
                        "type": "ERROR",
                        "message": str(e)
                    }))
            else:
                await websocket.send_text(json.dumps({
                    "type": "INFO",
                    "message": f"Action type '{msg_type}' received but not registered in stream loops."
                }))
                
    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if user_id:
            manager.disconnect(websocket, user_id)
