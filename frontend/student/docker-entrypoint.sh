#!/bin/sh
set -e
echo "[student] Injecting VITE_API_BASE_URL..."
find /usr/share/nginx/html -name "*.js" | xargs -r sed -i "s|__VITE_API_BASE_URL__|${VITE_API_BASE_URL}|g"
echo "[student] Starting nginx..."
exec nginx -g 'daemon off;'
