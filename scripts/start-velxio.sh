#!/usr/bin/env bash
set -euo pipefail

container_name="${VELXIO_CONTAINER_NAME:-ubo-velxio}"
port="${VELXIO_PORT:-3080}"
image="${VELXIO_IMAGE:-ghcr.io/davidmonterocrespo24/velxio:master}"

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then rerun this script." >&2
  exit 1
fi

if curl -fsS "http://localhost:${port}/editor" >/dev/null 2>&1; then
  echo "Velxio simulator is already available at http://localhost:${port}/editor"
  exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -qx "${container_name}"; then
  docker start "${container_name}" >/dev/null
else
  docker run -d \
    --name "${container_name}" \
    -p "${port}:80" \
    -v ubo-velxio-data:/app/data \
    -v ubo-velxio-arduino-libs:/root/.arduino15 \
    -v ubo-velxio-arduino-user-libs:/root/Arduino \
    -v ubo-velxio-ccache:/var/cache/ccache \
    -v ubo-velxio-build:/var/lib/velxio-build \
    "${image}" >/dev/null
fi

echo "Velxio simulator is starting at http://localhost:${port}/editor"
