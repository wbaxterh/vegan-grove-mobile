#!/usr/bin/env bash
# EAS Build lifecycle hook: runs on the build server before dependencies install.
# https://docs.expo.dev/build-reference/npm-hooks/
#
# Store-bound profiles get the production readiness checks. Internal builds skip
# them so a dev client can point at a non-production API.

set -u

case "${EAS_BUILD_PROFILE:-}" in
  testflight|playstore|production)
    echo "Store profile '$EAS_BUILD_PROFILE': running production readiness checks"
    bash scripts/check-prod-ready.sh
    ;;
  *)
    echo "Profile '${EAS_BUILD_PROFILE:-unknown}': skipping production readiness checks"
    ;;
esac
