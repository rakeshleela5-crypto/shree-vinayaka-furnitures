import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class RealtimeConnectionManager:
    """
    Manages active WebSocket connections across showroom terminals
    (counter POS terminals, owner laptops, warehouse mobile tablets) (#37, #54).
    Provides instant (<200ms) multi-terminal synchronization.
    Supports terminal-specific routing and showroom-wide broadcasts.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.terminal_connections: Dict[str, List[WebSocket]] = {}
        self.socket_to_terminal: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, terminal_id: Optional[str] = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if terminal_id:
            if terminal_id not in self.terminal_connections:
                self.terminal_connections[terminal_id] = []
            self.terminal_connections[terminal_id].append(websocket)
            self.socket_to_terminal[websocket] = terminal_id
        logger.info(f"Showroom terminal connected (terminal_id={terminal_id}). Active terminals: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        terminal_id = self.socket_to_terminal.pop(websocket, None)
        if terminal_id and terminal_id in self.terminal_connections:
            if websocket in self.terminal_connections[terminal_id]:
                self.terminal_connections[terminal_id].remove(websocket)
            if not self.terminal_connections[terminal_id]:
                del self.terminal_connections[terminal_id]

        logger.info(f"Showroom terminal disconnected (terminal_id={terminal_id}). Active terminals: {len(self.active_connections)}")

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

    async def broadcast_to_terminal(self, terminal_id: str, message: Dict[str, Any]):
        """
        Direct targeted event to a specific cashier terminal (e.g. POS-01) (#37).
        """
        term_sockets = self.terminal_connections.get(terminal_id, [])
        if not term_sockets:
            # Fall back to global broadcast if terminal not explicitly targeted or connected
            await self.broadcast(message)
            return

        payload_str = json.dumps(message)
        dead = []
        for ws in list(term_sockets):
            try:
                await ws.send_text(payload_str)
            except Exception as e:
                logger.warning(f"Error sending to terminal {terminal_id}: {e}")
                dead.append(ws)

        for d in dead:
            self.disconnect(d)

    def broadcast_sync(self, message: Dict[str, Any], terminal_id: Optional[str] = None):
        """
        Synchronous wrapper to allow calling broadcast from regular sync FastAPI endpoints.
        Safely schedules broadcast on the running asyncio event loop.
        """
        coro = self.broadcast_to_terminal(terminal_id, message) if terminal_id else self.broadcast(message)
        try:
            loop = asyncio.get_running_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(coro, loop)
            else:
                asyncio.run(coro)
        except RuntimeError:
            try:
                loop = asyncio.new_event_loop()
                loop.run_until_complete(coro)
                loop.close()
            except Exception as err:
                logger.error(f"Failed to broadcast sync event: {err}")

    def broadcast_payment_success(
        self,
        invoice_id: int,
        utr: str,
        amount: float,
        customer_name: Optional[str] = None,
        invoice_no: Optional[str] = None,
        terminal_id: Optional[str] = None
    ):
        """
        Dispatches PAYMENT_SUCCESS event over WebSockets when Decentro confirms payment (#37).
        Enables POS screen to auto-complete the bill and print receipt without manual refresh.
        """
        self.broadcast_sync(
            {
                "event": "PAYMENT_SUCCESS",
                "invoice_id": invoice_id,
                "invoice_no": invoice_no,
                "utr": utr,
                "amount": amount,
                "customer_name": customer_name,
                "status": "SETTLED"
            },
            terminal_id=terminal_id
        )

    def broadcast_assembly_update(
        self,
        task_no: str,
        stage: str,
        carpenter_name: Optional[str] = None,
        invoice_no: Optional[str] = None
    ):
        """
        Dispatches ASSEMBLY_STATUS_UPDATED event over WebSockets (#54).
        """
        self.broadcast_sync({
            "event": "ASSEMBLY_STATUS_UPDATED",
            "task_no": task_no,
            "stage": stage,
            "carpenter_name": carpenter_name,
            "invoice_no": invoice_no
        })

# Singleton instance for the application
realtime_manager = RealtimeConnectionManager()
