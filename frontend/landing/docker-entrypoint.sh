#!/bin/sh
set -e
echo "[landing] Injecting NEXT_PUBLIC_API_URL..."
find /app/.next/static -name "*.js" | xargs -r sed -i "s|__NEXT_PUBLIC_API_URL__|${NEXT_PUBLIC_API_URL}|g"
find /app/.next/server -name "*.js" | xargs -r sed -i "s|__NEXT_PUBLIC_API_URL__|${NEXT_PUBLIC_API_URL}|g"
echo "[landing] Starting Next.js..."
exec node server.js
