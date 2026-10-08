#!/usr/bin/env bash
# Check a running PrettyDocs server: SPA fallback, cache headers, compression and security headers.
# Usage: scripts/check-headers.sh https://docs.team2102.org   (or http://127.0.0.1:8090)
# Exit code: the number of failed checks.
set -u
base="${1:?usage: check-headers.sh <base-url>}"
base="${base%/}"
robot="${2:-2026-offseason}"
fails=0
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; fails=$((fails + 1)); }
header() { grep -i "^$2:" <<<"$1" | head -1 | cut -d' ' -f2- | tr -d '\r'; }
status() { head -1 <<<"$1" | awk '{print $2}'; }

root=$(curl -sS -D - -o "$tmp/root" "$base/")
[[ "$(status "$root")" == 200 ]] && pass "/ is 200" || fail "/ is $(status "$root")"
[[ "$(header "$root" cache-control)" == *no-cache* ]] && pass "/ Cache-Control no-cache" || fail "/ Cache-Control: $(header "$root" cache-control)"
[[ -n "$(header "$root" content-security-policy)" ]] && pass "/ has a Content-Security-Policy" || fail "/ has no Content-Security-Policy"
[[ "$(header "$root" x-content-type-options)" == nosniff ]] && pass "/ X-Content-Type-Options nosniff" || fail "/ X-Content-Type-Options: $(header "$root" x-content-type-options)"

deep=$(curl -sS -D - -o "$tmp/deep" "$base/$robot/3d?device=pdh")
if [[ "$(status "$deep")" == 200 ]] && grep -q '<div id="root">' "$tmp/deep"; then
  pass "deep link /$robot/3d?device=pdh serves the app"
else
  fail "deep link /$robot/3d?device=pdh is $(status "$deep") or not the app"
fi
[[ "$(header "$deep" cache-control)" == *no-cache* ]] && pass "deep link Cache-Control no-cache" || fail "deep link Cache-Control: $(header "$deep" cache-control)"

idx=$(curl -sS -D - -o /dev/null "$base/content/robots.json")
[[ "$(status "$idx")" == 200 ]] && pass "/content/robots.json is 200" || fail "/content/robots.json is $(status "$idx")"
[[ "$(header "$idx" cache-control)" == "public, max-age=300" ]] && pass "/content Cache-Control max-age=300" || fail "/content Cache-Control: $(header "$idx" cache-control)"

missing=$(curl -sS -D - -o /dev/null "$base/content/robots/nope/wiring.json")
[[ "$(status "$missing")" == 404 ]] && pass "a missing content file is 404 (no app fallback)" || fail "a missing content file is $(status "$missing")"

asset=$(grep -o '/assets/[^"]*\.js' "$tmp/root" | head -1)
if [[ -n "$asset" ]]; then
  a=$(curl -sS -D - -o /dev/null "$base$asset")
  [[ "$(header "$a" cache-control)" == *"max-age=31536000"*immutable* ]] && pass "$asset immutable" || fail "$asset Cache-Control: $(header "$a" cache-control)"
else
  fail "no /assets/*.js link in /"
fi

scene=$(curl -sS -D - -o /dev/null -H 'Accept-Encoding: zstd, gzip' "$base/content/robots/$robot/scene.json")
[[ -n "$(header "$scene" content-encoding)" ]] && pass "scene.json is compressed ($(header "$scene" content-encoding))" || fail "scene.json is not compressed"

printf '%d failed\n' "$fails"
exit "$fails"
