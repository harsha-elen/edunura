##############################################################################
# Student Portal — Multi-stage Dockerfile
#
# Build args:
#   VITE_API_BASE_URL  — backend API URL (always required)
#   VITE_BASE_PATH     — '/'    → subdomain mode: app.clientdomain.com
#                        '/app' → path mode:      clientdomain.com/app
#                        Defaults to '/'
##############################################################################

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=__VITE_API_BASE_URL__
ARG VITE_BASE_PATH=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Re-declare ARG so it is accessible in this stage
ARG VITE_BASE_PATH=/

COPY --from=builder /app/dist /usr/share/nginx/html

# Generate nginx config based on routing mode
RUN set -e; \
    if [ "$VITE_BASE_PATH" = "/" ]; then \
      echo "nginx: subdomain mode (root /)"; \
      printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  gzip on;\n  gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;\n  location / {\n    try_files $uri $uri/ /index.html;\n    add_header Cache-Control "public, max-age=31536000, immutable";\n  }\n  location = /index.html {\n    add_header Cache-Control "no-cache";\n  }\n}\n' \
        > /etc/nginx/conf.d/default.conf; \
    else \
      BASE="$VITE_BASE_PATH"; \
      echo "nginx: path mode (${BASE})"; \
      printf 'server {\n  listen 80;\n  gzip on;\n  gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;\n  location %s/ {\n    alias /usr/share/nginx/html/;\n    try_files $uri $uri/ %s/index.html;\n    add_header Cache-Control "public, max-age=31536000, immutable";\n  }\n  location = %s/index.html {\n    alias /usr/share/nginx/html/index.html;\n    add_header Cache-Control "no-cache";\n  }\n  location = %s {\n    return 301 %s/;\n  }\n}\n' \
        "$BASE" "$BASE" "$BASE" "$BASE" "$BASE" \
        > /etc/nginx/conf.d/default.conf; \
    fi

EXPOSE 80

# Entrypoint: injects VITE_API_BASE_URL at container startup
# (VITE_BASE_PATH is already baked into nginx config and JS routing at build time)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh
CMD ["/docker-entrypoint.sh"]
