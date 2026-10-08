#!/bin/sh
# Refresh a vendored directory from upstream.
# Usage: scripts/update-vendored.sh <path> <sha>
# Example: scripts/update-vendored.sh sf2-service abc1234
set -eu

path="$1"
sha="$2"

case "$path" in
  sf2-service) url="https://github.com/yishengjiang99/sf2-service" ;;
  fft-64bit) url="https://github.com/yishengjiang99/fft-64bit/" ;;
  *) echo "unknown vendored path: $path" >&2; exit 1 ;;
esac

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git clone --quiet "$url" "$tmp/upstream"
git -C "$tmp/upstream" checkout --quiet "$sha"
# Drop the upstream git metadata; keep everything else, then re-apply pruning.
rm -rf "$tmp/upstream/.git"
rm -rf "$path"
mv "$tmp/upstream" "$path"

case "$path" in
  sf2-service)
    rm -rf "$path/.github" "$path/_codeql_detected_source_root" "$path/.gitignore"
    rm -f "$path/type-check-example.ts" "$path/package-lock.json"
    rm -f "$path/testing/fixtures/"*.sf2
    rmdir "$path/testing/fixtures" 2>/dev/null || true
    ;;
  fft-64bit)
    rm -f "$path/song.mp3" "$path/index.html" "$path/test.html"
    rm -f "$path/.gitattributes" "$path/.gitignore"
    ;;
esac

echo "Updated $path to $sha."
echo "Remember to re-apply local patches (see git log for $path) and update third_party/VENDORED.md."
