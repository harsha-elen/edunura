##############################################################################
# Admin Portal — Multi-stage Dockerfile
# Stage 1: Build Vite app
# Stage 2: Nginx serves the static output
##############################################################################

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# VITE_API_BASE_URL is baked into the JS bundle at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Copy Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA router support — all unknown routes return index.html
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
  gzip on;\n\
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;\n\
  add_header Cache-Control "public, max-age=31536000, immutable";\n\
  location /index.html {\n\
    add_header Cache-Control "no-cache";\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
