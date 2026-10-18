import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class RealtimeConnectionManager:
    """
    Manages active WebSocket connections across showroom terminals
    (counter terminals, owner laptops, warehouse mobile tablets).
    Provides instant (<200ms) multi-terminal synchronization.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Showroom terminal connected. Active terminals: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Showroom terminal disconnected. Active terminals: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """
        Broadcast an event to all open terminals.
        Stale/broken sockets are cleaned up gracefully.
        """
        if not self.active_connections:
            return

        payload_str = json.dumps(message)
        dead_connections = []

        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload_str)
            except Exception as e:
                logger.warning(f"Error sending to terminal socket: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    def broadcast_sync(self, message: Dict[str, Any]):
        """
        Synchronous wrapper to allow calling broadcast from regular sync FastAPI endpoints.
        Safely schedules broadcast on the running asyncio event loop.
        """
        try:
            loop = asyncio.get_running_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast(message), loop)
            else:
                asyncio.run(self.broadcast(message))
        except RuntimeError:
            # Fallback if called outside main event loop thread
            try:
                loop = asyncio.new_event_loop()
                loop.run_until_complete(self.broadcast(message))
                loop.close()
            except Exception as err:
                logger.error(f"Failed to broadcast sync event: {err}")

# Singleton instance for the application
realtime_manager = RealtimeConnectionManager()
