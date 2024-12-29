#!/bin/bash

# Check if required environment variables are set
if [ -z "$SERVICE_USER" ] || [ -z "$PROJECT_PATH" ]; then
    echo "Error: Required environment variables are not set"
    echo "Please set the following variables:"
    echo "  SERVICE_USER  - The user to run the service as"
    echo "  PROJECT_PATH  - The full path to the project directory"
    echo ""
    echo "Example:"
    echo "  export SERVICE_USER=your_username"
    echo "  export PROJECT_PATH=/path/to/your/project"
    exit 1
fi

# Install dependencies
npm install

# Create systemd service file
sudo tee /etc/systemd/system/qiaozhishuo.service << EOF
[Unit]
Description=QiaoZhiShuo Website
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_PATH
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable and start the service
sudo systemctl enable qiaozhishuo
sudo systemctl start qiaozhishuo

# Show status
sudo systemctl status qiaozhishuo 