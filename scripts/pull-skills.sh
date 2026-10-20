#!/usr/bin/env bash
# Copy skills from this machine's ~/.agents/skills back into the repo,
# e.g. after installing new ones with `npx skills add`. Secrets stay out.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rsync -a \
  --include='.env.example' \
  --exclude='.env' --exclude='.env.*' \
  --exclude='.DS_Store' --exclude='.legacy-talentbot/' --exclude='node_modules/' \
  "$HOME/.agents/skills/" "$REPO/agents/skills/"

git -C "$REPO" status --short agents/skills
