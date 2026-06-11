#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Deploying Firestore + Storage rules to lughaapp..."
npx firebase deploy --only firestore:rules,storage
echo "Done."
