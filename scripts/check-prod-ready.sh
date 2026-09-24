#!/usr/bin/env bash
# Production readiness checks.
#
# Runs from `npm run check:prod` (part of `npm run validate`, so also in CI)
# and from `eas-build-pre-install.sh` on store profiles. It fails when a dev
# host, a private IP, a known key prefix, or a local-API switch is anywhere
# in `src/` or `app/`, or when `.env.example` does not point at production.

set -u
cd "$(dirname "$0")/.."

ERRORS=0
PROD_API_URL='https://api.vegangrove.org/api'

echo "=== check-prod-ready ==="

# 1. Forbidden strings in shipped source. Each entry is an extended regex.
FORBIDDEN=(
  'localhost'
  '127\.0\.0\.1'
  '192\.168\.'
  '10\.0\.'
  'sk_live'
  'AKIA'
  'AIza'
  'EXPO_PUBLIC_USE_LOCAL'
)

for pattern in "${FORBIDDEN[@]}"; do
  hits=$(grep -rnE --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.json' \
    "$pattern" src app 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "FAIL: '$pattern' found in shipped source:"
    echo "$hits"
    ERRORS=$((ERRORS + 1))
  else
    echo "PASS: no '$pattern'"
  fi
done

# 2. .env.example must name the production API URL, so a copied .env starts safe.
if grep -qE "^EXPO_PUBLIC_API_BASE_URL=${PROD_API_URL}\$" .env.example 2>/dev/null; then
  echo "PASS: .env.example points at $PROD_API_URL"
else
  echo "FAIL: .env.example EXPO_PUBLIC_API_BASE_URL is not $PROD_API_URL"
  ERRORS=$((ERRORS + 1))
fi

# 3. The code fallback must also be production.
if grep -qF "?? '${PROD_API_URL}'" src/constants/api.ts 2>/dev/null; then
  echo "PASS: src/constants/api.ts falls back to $PROD_API_URL"
else
  echo "FAIL: src/constants/api.ts fallback is not $PROD_API_URL"
  ERRORS=$((ERRORS + 1))
fi

# 4. Native folders must not be tracked (Continuous Native Generation).
if git ls-files --error-unmatch ios android >/dev/null 2>&1; then
  echo "FAIL: ios/ or android/ is tracked in git"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: ios/ and android/ are not tracked"
fi

# 5. No .env file is tracked.
tracked_env=$(git ls-files '.env' '.env.*' 2>/dev/null | grep -v '^\.env\.example$' || true)
if [ -n "$tracked_env" ]; then
  echo "FAIL: env file tracked in git: $tracked_env"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: no .env tracked"
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS check(s) failed. Fix before building for a store."
  exit 1
fi
echo "All production readiness checks passed."
