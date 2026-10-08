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
  -e HOST_UID="$(id -u)" \
  -e HOST_GID="$(id -g)" \
  -v "$PWD":/src \
  -w /src \
  "$EMSDK_IMAGE" \
  bash -c 'source /emsdk/emsdk_env.sh >/dev/null || true
    nb=$(command -v node || true)
    if [ -n "$nb" ]; then cp -L "$nb" /tmp/node && chmod a+x /tmp/node && export PATH="/tmp:$PATH"; fi
    if [ "$(id -u)" = 0 ] && command -v setpriv >/dev/null 2>&1; then
      exec setpriv --reuid="${HOST_UID}" --regid="${HOST_GID}" --clear-groups -- "$@"
    fi
    exec "$@"' _ "$@"
