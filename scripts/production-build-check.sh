#!/usr/bin/env bash
# Simulates Hostinger production build:
# 1) fresh install with production deps only (no devDependencies)
# 2) NODE_ENV=production build
# 3) restore full local dev install
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "========================================"
echo " Production build check (Hostinger-like)"
echo "========================================"
echo ""
echo "Step 1/4: Remove node_modules"
rm -rf node_modules

echo ""
echo "Step 2/4: npm ci --omit=dev (production deps only)"
npm ci --omit=dev

echo ""
echo "Step 3/4: NODE_ENV=production build"
set +e
NODE_ENV=production npx next build --webpack
BUILD_EXIT=$?
set -e

echo ""
echo "Step 4/4: Restore full dev install (npm ci)"
rm -rf node_modules
npm ci

echo ""
if [ $BUILD_EXIT -eq 0 ]; then
  echo "✓ Production build check passed"
else
  echo "✗ Production build check failed (exit $BUILD_EXIT)"
  echo "  Fix the errors above before deploying to Hostinger."
fi

exit $BUILD_EXIT
