from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any
import json
import asyncio
import logging
from datetime import datetime

from connection_manager import ConnectionManager
from automation_generator import AutomationSequenceGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="JotForm Extension WebSocket API",
    description="WebSocket backend for JotForm automation extension",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()



@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "JotForm Extension WebSocket API",
        "status": "running",
        "active_connections": len(manager.active_connections)
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(manager.active_connections),
        "connection_details": [
            {
                "client_id": metadata["client_id"],
                "connected_at": metadata["connected_at"].isoformat(),
                "last_activity": metadata["last_activity"].isoformat()
            }
            for metadata in manager.connection_metadata.values()
        ]
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for extension communication"""
    await manager.connect(websocket)
    
    try:
        # Send welcome message
        welcome_message = {
            "type": "connection_established",
            "message": "Connected to JotForm Extension WebSocket API",
            "timestamp": datetime.now().isoformat()
        }
        await manager.send_personal_message(json.dumps(welcome_message), websocket)
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                logger.info(f"Received message type: {message_type}")
                
                if message_type == "get_automation_sequence":
                    # Handle automation sequence request
                    sequence_type = message.get("sequence_type", "form_creation")
                    parameters = message.get("parameters", {})
                    
                    if sequence_type == "form_creation":
                        sequence = AutomationSequenceGenerator.get_form_creation_sequence()
                    elif sequence_type == "form_building":
                        sequence = AutomationSequenceGenerator.get_form_building_sequence()
                    else:
                        sequence = AutomationSequenceGenerator.get_custom_sequence(sequence_type, parameters)
                    
                    response = {
                        "type": "automation_sequence_response",
                        "sequence": sequence,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    await manager.send_personal_message(json.dumps(response), websocket)
                
                elif message_type == "ping":
                    # Handle ping request
                    pong_response = {
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.send_personal_message(json.dumps(pong_response), websocket)
                
                elif message_type == "automation_status":
                    # Handle automation status update
                    status = message.get("status")
                    sequence_id = message.get("sequence_id")
                    
                    logger.info(f"Automation status update: {status} for sequence {sequence_id}")
                    
                    # Echo back the status
                    status_response = {
                        "type": "status_acknowledged",
                        "sequence_id": sequence_id,
                        "status": status,
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.send_personal_message(json.dumps(status_response), websocket)
                
                else:
                    # Handle unknown message type
                    error_response = {
                        "type": "error",
                        "message": f"Unknown message type: {message_type}",
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.send_personal_message(json.dumps(error_response), websocket)
                    
            except json.JSONDecodeError:
                error_response = {
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.now().isoformat()
                }
                await manager.send_personal_message(json.dumps(error_response), websocket)
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                error_response = {
                    "type": "error",
                    "message": f"Server error: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                }
                await manager.send_personal_message(json.dumps(error_response), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")