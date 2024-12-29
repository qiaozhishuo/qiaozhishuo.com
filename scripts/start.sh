#!/bin/bash

# Kill any process using port 3000
kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process $pid using port $port"
        kill -9 $pid
    fi
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Kill process on port 3000 if it exists
kill_port 3000

# Start the server
NODE_ENV=production node server.js 