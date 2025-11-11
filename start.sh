#!/bin/bash

echo "EXPO CRM - Starting application..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Check if client/node_modules exists
if [ ! -d client/node_modules ]; then
    echo "Installing frontend dependencies..."
    cd client
    npm install
    cd ..
fi

# Create temp directory if it doesn't exist
mkdir -p temp

echo "Starting backend server..."
npm run dev &

# Wait a bit for backend to start
sleep 3

echo "Starting frontend..."
cd client
npm start

