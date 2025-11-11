# Dockerfile for LocalCRM
# Multi-stage build for production

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:18-alpine
WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server files
COPY server/ ./server/

# Copy built frontend
COPY --from=frontend-builder /app/client/build ./client/build

# Create necessary directories
RUN mkdir -p temp files

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server/index.js"]

