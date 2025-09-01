from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any
import json
import asyncio
import logging
from datetime import datetime

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

class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str = None):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_metadata[websocket] = {
            "client_id": client_id or f"client_{len(self.active_connections)}",
            "connected_at": datetime.now(),
            "last_activity": datetime.now()
        }
        logger.info(f"Client {self.connection_metadata[websocket]['client_id']} connected")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        if websocket in self.active_connections:
            client_id = self.connection_metadata.get(websocket, {}).get("client_id", "unknown")
            self.active_connections.remove(websocket)
            del self.connection_metadata[websocket]
            logger.info(f"Client {client_id} disconnected")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific client"""
        try:
            await websocket.send_text(message)
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]["last_activity"] = datetime.now()
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        """Send message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
                if connection in self.connection_metadata:
                    self.connection_metadata[connection]["last_activity"] = datetime.now()
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

class AutomationSequenceGenerator:
    """Generates automation sequences for JotForm"""
    
    @staticmethod
    def get_form_creation_sequence() -> Dict[str, Any]:
        """Generate form creation automation sequence"""
        return {
            "sequenceId": "form-creation-v1",
            "name": "Create New Form",
            "steps": [
                {
                    "action": "navigate",
                    "url": "https://www.jotform.com/myforms",
                    "description": "Navigate to Jotform workspace",
                    "delay": 2000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='create-button'], .create-button, button[aria-label*='Create']",
                    "description": "Click Create button",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='form-button'], .form-button, button[aria-label*='Form']",
                    "description": "Click Form button",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='start-from-scratch'], .start-from-scratch, button[aria-label*='Start from scratch']",
                    "description": "Click Start from scratch",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='classic-form'], .classic-form, button[aria-label*='Classic form']",
                    "description": "Click Classic form",
                    "delay": 500
                },
                {
                    "action": "click",
                    "selector": "[data-testid='close-modal'], .close-modal, button[aria-label*='Close']",
                    "description": "Close modal dialog",
                    "delay": 1000
                }
            ]
        }
    
    @staticmethod
    def get_form_building_sequence() -> Dict[str, Any]:
        """Generate form building automation sequence"""
        return {
            "sequenceId": "form-building-v1",
            "name": "Build Form Elements",
            "steps": [
                {
                    "action": "wait",
                    "description": "Wait for page to initialize",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='heading-form'], .heading-form, .form-element[data-type='control_head']",
                    "description": "Click on heading form element",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='settings-button'], .settings-button, button[aria-label*='Settings']",
                    "description": "Click settings button",
                    "delay": 1000
                },
                {
                    "action": "type",
                    "selector": "[data-testid='text-field'], .text-field, input[type='text'], textarea",
                    "text": "Course Registration",
                    "description": "Enter form title text",
                    "delay": 500
                },
                {
                    "action": "click",
                    "selector": "[data-testid='settings-close'], .settings-close, button[aria-label*='Close']",
                    "description": "Close settings menu",
                    "delay": 500
                }
            ]
        }
    
    @staticmethod
    def get_custom_sequence(sequence_type: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate custom automation sequence based on type and parameters"""
        if sequence_type == "form_creation":
            return AutomationSequenceGenerator.get_form_creation_sequence()
        elif sequence_type == "form_building":
            return AutomationSequenceGenerator.get_form_building_sequence()
        else:
            return {
                "sequenceId": f"custom-{sequence_type}-v1",
                "name": f"Custom {sequence_type.replace('_', ' ').title()}",
                "steps": []
            }

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