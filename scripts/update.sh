#!/usr/bin/env bash
# Bring this machine up to date: pull the repo, then re-run the dotfiles and
# agents steps of setup.sh. Runs from `su-sync pull`, from `su-sync push` on
# every other machine, and from the autoupdate timer at boot.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

# The boot timer and a push from another machine can arrive together.
if command -v flock >/dev/null 2>&1; then
  exec 9>"${XDG_RUNTIME_DIR:-/tmp}/su-update.lock"
  flock -n 9 || { echo "another update is running"; exit 0; }
fi

# Right after boot the network can need a moment.
tries=0
until git fetch --quiet origin; do
  tries=$((tries + 1))
  [ "$tries" -ge 6 ] && { echo "git fetch failed, giving up" >&2; exit 1; }
  sleep 10
done

before="$(git rev-parse --short HEAD)"
git rebase --quiet --autostash '@{u}'
after="$(git rev-parse --short HEAD)"
if [ "$before" = "$after" ]; then
  echo "repo already at $after"
else
  echo "repo $before -> $after"
fi

# Never replace files made by hand; only fill in what is missing.
SU_NO_REPLACE=1 ./setup.sh --skip-cli --skip-apps --quiet
