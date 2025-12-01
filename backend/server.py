import asyncio
import json
import threading
import os
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from doc_watcher import start_watchdog, load_prev_state, scan_all_docs_and_update, save_prev_state

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# Event loop for the main thread (FastAPI)
# We need a way to bridge the sync callback from watchdog to the async websocket broadcast
# We'll use an asyncio loop running in the main thread, but the watchdog runs in a separate thread.
# The callback is called from the watchdog thread.
# We can use `asyncio.run_coroutine_threadsafe` if we have access to the loop.

loop = None

def on_change_event(event):
    """Callback called by doc_watcher from a background thread."""
    print(f"Server received event: {event['changed_doc']}")
    if loop and loop.is_running():
        asyncio.run_coroutine_threadsafe(manager.broadcast(event), loop)

def start_background_watcher():
    """Starts the doc_watcher in a separate thread."""
    print("Starting background watcher...")
    prev = load_prev_state()
    if not prev:
        scan_all_docs_and_update(prev)
        save_prev_state(prev)
    
    # This blocks, so run in thread
    start_watchdog(prev, on_event=on_change_event)

@app.on_event("startup")
async def startup_event():
    global loop
    loop = asyncio.get_running_loop()
    
    # Start watchdog in a daemon thread
    t = threading.Thread(target=start_background_watcher, daemon=True)
    t.start()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from pydantic import BaseModel

class UpdateDocRequest(BaseModel):
    doc_id: str
    content: str

@app.post("/update-doc")
async def update_doc(request: UpdateDocRequest):
    try:
        # Sanitize doc_id to prevent directory traversal
        filename = os.path.basename(request.doc_id)
        file_path = os.path.join("docs", filename)
        
        # Ensure directory exists
        os.makedirs("docs", exist_ok=True)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(request.content)
            
        return {"status": "success", "message": f"Updated {filename}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
