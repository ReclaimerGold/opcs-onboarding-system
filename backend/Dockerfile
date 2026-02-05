# Production Dockerfile for backend service
# Uses multi-stage build for smaller final image

# =============================================================================
# Stage 1: Build native dependencies
# =============================================================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3, bcrypt)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./

# Install all dependencies including native modules
RUN npm install --omit=dev

# =============================================================================
# Stage 2: Production runtime
# =============================================================================
FROM node:22-bookworm-slim

ARG VERSION=dev
ENV VERSION=$VERSION

WORKDIR /app

# Copy built node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy package.json for runtime
COPY package.json ./

# Copy source
COPY src ./src

# Copy PDF templates (needed for form generation)
COPY storage/pdf-templates ./storage/pdf-templates

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash nodejs && \
    mkdir -p /app/database /app/storage/encrypted-pdfs /app/storage/encrypted-i9-docs /app/uploads && \
    chown -R nodejs:nodejs /app

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/index.js"]
