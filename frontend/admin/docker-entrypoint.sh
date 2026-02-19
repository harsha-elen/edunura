#!/bin/sh
set -e
echo "[admin] Injecting VITE_API_BASE_URL..."
find /usr/share/nginx/html -name "*.js" | xargs -r sed -i "s|__VITE_API_BASE_URL__|${VITE_API_BASE_URL}|g"
echo "[admin] Starting nginx..."
exec nginx -g 'daemon off;'
