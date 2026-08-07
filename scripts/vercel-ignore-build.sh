#!/usr/bin/env bash
# Vercel Ignore Build Step — exit 0 = skip build, exit 1 = run build.
# Image uploads commit only to public/bilder/; those don't need a new app deploy.

set -euo pipefail

# Always build if we can't compare commits (e.g. first deploy).
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  exit 1
fi

changed_files=$(git diff --name-only HEAD^ HEAD)

if [ -z "$changed_files" ]; then
  exit 1
fi

while IFS= read -r file; do
  case "$file" in
    public/bilder/*) ;;
    *) exit 1 ;;
  esac
done <<< "$changed_files"

echo "Only public/bilder/ changed — skipping Vercel build."
exit 0
