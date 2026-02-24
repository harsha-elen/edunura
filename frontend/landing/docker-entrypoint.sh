#!/bin/sh
set -e

replace_in_bundle() {
  PLACEHOLDER=$1
  VALUE=$2
  echo "[landing] Injecting ${PLACEHOLDER}..."
  find /app/.next -type f \( -name "*.js" -o -name "*.html" -o -name "*.rsc" -o -name "*.json" \) \
    | xargs -r sed -i "s|${PLACEHOLDER}|${VALUE}|g"
}

replace_in_bundle "__NEXT_PUBLIC_API_URL__" "${NEXT_PUBLIC_API_URL}"
replace_in_bundle "__NEXT_PUBLIC_STUDENT_APP_URL__" "${NEXT_PUBLIC_STUDENT_APP_URL}"

echo "[landing] Starting Next.js..."
export HOSTNAME=0.0.0.0
exec node server.js
