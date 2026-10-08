#!/bin/sh
# Run a command inside the pinned emsdk toolchain container.
#
#   scripts/in-toolchain.sh make wasm
#
# In CI the build job already runs inside the container, so this detects
# /emsdk + emcc on PATH and just execs the command. Anywhere else it runs
# the exact same command in `docker run` with the pinned image from
# toolchain.env, so developers and CI build with the same toolchain.
set -eu
cd "$(dirname "$0")/.."

if [ -f ./toolchain.env ]; then
  # shellcheck disable=SC1091
  . ./toolchain.env
fi
: "${EMSDK_IMAGE:?EMSDK_IMAGE is not set (toolchain.env missing?)}"

if [ -d /emsdk ] && command -v emcc >/dev/null 2>&1; then
  exec "$@"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is required to run the pinned toolchain outside its container" >&2
  echo "install docker, or run on a machine with the emsdk image's tools on PATH" >&2
  exit 1
fi

exec docker run --rm \
  -u "$(id -u):$(id -g)" \
  -v "$PWD":/src \
  -w /src \
  "$EMSDK_IMAGE" \
  "$@"
