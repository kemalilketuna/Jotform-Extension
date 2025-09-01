#!/usr/bin/env python3
"""
Startup script for JotForm Extension WebSocket API
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def main():
    """Start the WebSocket server"""
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    log_level = os.getenv("LOG_LEVEL", "info")
    reload = os.getenv("RELOAD", "true").lower() == "true"

    print(f"Starting JotForm Extension WebSocket API...")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Log Level: {log_level}")
    print(f"Reload: {reload}")
    print(f"WebSocket URL: ws://{host}:{port}/ws")
    print(f"Health Check: http://{host}:{port}/health")

    uvicorn.run("main:app", host=host, port=port, log_level=log_level, reload=reload)


if __name__ == "__main__":
    main()
