# Multi-architecture Dockerfile
# Supports: linux/amd64 and linux/arm64
# Stage 1: Build the application
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json for npm install
COPY package*.json ./

# Install dependencies, including devDependencies for building
# Use --ignore-scripts to prevent prepare hook from running before source is copied
RUN npm install --ignore-scripts

# Copy the source code
COPY src ./src
COPY tsconfig.json ./

# Build the project
RUN npm run build

# Stage 2: Run the application
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/build /app/build
COPY --from=builder /app/package*.json ./

# Install only production dependencies
# Use --ignore-scripts since build is already complete
RUN npm ci --only=production --ignore-scripts

# SENDGRID_API_KEY must be provided at runtime via:
# - docker run -e SENDGRID_API_KEY=your-key
# - docker-compose environment variable
# - Kubernetes secret/env
# The application will fail to start if this is not set
ENV NODE_ENV=production

# Specify the command to run
ENTRYPOINT ["node", "build/index.js"]
