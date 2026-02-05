# Production Dockerfile for frontend service
# Multi-stage build: Node.js for building, nginx for serving

# =============================================================================
# Stage 1: Build with Node.js
# =============================================================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (using npm install since project uses bun.lock)
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Inject release version for footer display (from GitHub tag via build-arg)
ARG VERSION=dev
ENV VITE_APP_VERSION=$VERSION

# Build for production
RUN npm run build

# =============================================================================
# Stage 2: Production runtime with nginx
# =============================================================================
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
