#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
frontend_dir="${repo_root}/vendor/velxio/frontend"
backend_port="${VELXIO_PORT:-3080}"
frontend_port="${VELXIO_FRONTEND_PORT:-3081}"
npm_cache="${repo_root}/.npm-cache/velxio"

"${repo_root}/scripts/start-velxio.sh"

cd "${frontend_dir}"

if [ ! -d node_modules ]; then
  npm install --legacy-peer-deps --no-package-lock --cache "${npm_cache}"
fi

VELXIO_API_PROXY_TARGET="http://127.0.0.1:${backend_port}" \
  npm run dev -- --host 0.0.0.0 --port "${frontend_port}"
