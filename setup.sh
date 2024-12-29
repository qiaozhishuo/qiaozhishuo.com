#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    apt update
    apt install -y nginx
fi

# Create Nginx configuration directory if it doesn't exist
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Copy Nginx configuration
cp nginx/qiaozhishuo.conf /etc/nginx/sites-available/qiaozhishuo.conf

# Create symbolic link if it doesn't exist
if [ ! -f /etc/nginx/sites-enabled/qiaozhishuo.conf ]; then
    ln -s /etc/nginx/sites-available/qiaozhishuo.conf /etc/nginx/sites-enabled/
fi

# Remove default Nginx configuration if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Install Node.js dependencies
npm install

# Set environment variables
export PORT=3000
export NODE_ENV=production

# Start the Node.js server using PM2 if available
if command -v pm2 &> /dev/null; then
    pm2 start server.js --name qiaozhishuo
else
    # Install PM2 and start the server
    npm install -g pm2
    pm2 start server.js --name qiaozhishuo
fi

echo "Setup completed! The website should now be accessible at:"
echo "http://qiaozhishuo.com"
echo "http://www.qiaozhishuo.com" 