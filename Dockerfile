# Multi-stage Dockerfile for OPCS Onboarding System
# Builds both frontend and backend into a single deployable image

# =============================================================================
# Stage 1: Build frontend with Node.js
# =============================================================================
FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json ./

# Install dependencies (using npm install since project uses bun.lock)
RUN npm install --legacy-peer-deps

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# =============================================================================
# Stage 2: Build backend with native dependencies
# =============================================================================
FROM node:22-bookworm-slim AS backend-builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3, bcrypt)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy backend package files
COPY backend/package.json ./

# Install all dependencies including native modules
RUN npm install --omit=dev

# Copy backend source
COPY backend/src ./src

# =============================================================================
# Stage 3: Production runtime
# =============================================================================
FROM node:22-bookworm-slim AS production

# Install nginx and supervisor for running multiple processes
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 opcs && \
    useradd -u 1001 -g opcs -s /bin/bash opcs

# Copy backend from builder
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/src ./src
COPY backend/package.json ./

# Copy PDF templates
COPY backend/storage/pdf-templates ./storage/pdf-templates

# Copy frontend build to nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration and update for combined container (localhost instead of backend)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i 's/proxy_pass http:\/\/backend:3000/proxy_pass http:\/\/127.0.0.1:3000/' /etc/nginx/conf.d/default.conf

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Create necessary directories
RUN mkdir -p /app/database /app/storage/encrypted-pdfs /app/storage/encrypted-i9-docs /app/uploads /var/log/supervisor && \
    chown -R opcs:opcs /app /var/log/supervisor

# Copy supervisor configuration
COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:backend]
command=node /app/src/index.js
directory=/app
user=opcs
autostart=true
autorestart=true
environment=NODE_ENV=production,PORT=3000
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose ports
EXPOSE 80 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# Start supervisor (manages both nginx and backend)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
