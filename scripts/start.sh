#!/bin/bash

# Kill all Node.js processes
echo "Killing all Node.js processes..."
pkill -f node || true
sleep 2

# Create logs directory if it doesn't exist
mkdir -p logs

# Make sure the port is actually free
while lsof -i:3000 >/dev/null 2>&1; do
    echo "Waiting for port 3000 to be free..."
    sleep 1
done

# Start the server
NODE_ENV=production node server.js 