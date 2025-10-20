# Production Dockerfile for Ludo Backend
FROM node:18-alpine

# Build arguments for environment variables
ARG NODE_ENV=production
ARG VATAN_SMS_API_ID
ARG VATAN_SMS_API_KEY
ARG VATAN_SMS_SENDER
ARG JWT_SECRET
ARG DB_SERVER
ARG DB_USER
ARG DB_PASSWORD
ARG DB_DATABASE

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV VATAN_SMS_API_ID=${VATAN_SMS_API_ID}
ENV VATAN_SMS_API_KEY=${VATAN_SMS_API_KEY}
ENV VATAN_SMS_SENDER=${VATAN_SMS_SENDER}
ENV JWT_SECRET=${JWT_SECRET}
ENV DB_SERVER=${DB_SERVER}
ENV DB_USER=${DB_USER}
ENV DB_PASSWORD=${DB_PASSWORD}
ENV DB_DATABASE=${DB_DATABASE}

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Copy production db config
COPY deployment/db-config.production.js ./db-config.js

# Create necessary directories
RUN mkdir -p logs uploads temp \
    && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["node", "server.js"]