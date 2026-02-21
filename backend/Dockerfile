##############################################################################
# Backend — Multi-stage Dockerfile
# Stage 1: Build TypeScript → JavaScript
# Stage 2: Production runtime (no dev deps, no source)
##############################################################################

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install only production deps — python3/make/g++ needed to compile bcrypt native binding
COPY package.json package-lock.json* ./
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev \
    && npm cache clean --force \
    && apk del python3 make g++

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Schema file for auto-initialization on first run
COPY database ./database

# Uploads directory (bind-mounted as Docker volume in production)
RUN mkdir -p uploads

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s \
  CMD wget -qO- http://localhost:5000/health || exit 1

EXPOSE 5000

CMD ["node", "dist/server.js"]
