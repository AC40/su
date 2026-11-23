#!/usr/bin/env bash
# su-sync: keep skills and config the same on every machine.
#
#   su-sync push [--all]    copy this machine's skills into the repo, commit,
#                           push, then update every machine in config/machines
#                           (--all also commits every other change in the repo)
#   su-sync pull            update this machine only
#   su-sync status          show the commit each machine is on
#   su-sync autoupdate [off]
#                           Linux: update this machine at boot and every hour
#                           (systemd user timer); "off" removes it
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
. "$REPO/lib/common.sh"

SSH_OPTS=(-o ConnectTimeout=8 -o BatchMode=yes)
SELF="$(hostname -s | tr '[:upper:]' '[:lower:]')"

# Print "host path" for every machine in config/machines except this one.
machines() {
  local host path
  while read -r host path _; do
    case "$host" in '' | '#'*) continue ;; esac
    [ "$(printf %s "$host" | tr '[:upper:]' '[:lower:]')" = "$SELF" ] && continue
    echo "$host ${path:-~/dev/su}"
  done <"$REPO/config/machines"
}

# on_all CMD: run CMD on every machine at the same time (CMD sees the repo as
# its working directory), then print one line per machine.
on_all() {
  local cmd="$1" tmp host path pid i=0 code
  local hosts=() pids=()
  tmp="$(mktemp -d)"
  while read -r host path; do
    # The path is left unquoted on purpose so the remote shell expands ~.
    ssh "${SSH_OPTS[@]}" "$host" \
      "cd $path 2>/dev/null || { echo 'no repo at $path'; exit 3; }; $cmd" \
      </dev/null >"$tmp/$host" 2>&1 &
    hosts+=("$host")
    pids+=($!)
  done < <(machines)

  local failed=0
  for pid in "${pids[@]+"${pids[@]}"}"; do
    host="${hosts[$i]}"
    i=$((i + 1))
    code=0
    wait "$pid" || code=$?
    case "$code" in
      0) ok "$host: $(grep -E '^repo |^[0-9a-f]{7,} ' "$tmp/$host" | tail -1)" ;;
      255) warn "$host: offline or SSH refused, skipped" ;;
      3) warn "$host: no repo there. Set it up once: ssh $host, clone the repo, run ./setup.sh" ;;
      *)
        failed=1
        warn "$host: failed (exit $code)"
        tail -n 15 "$tmp/$host" | sed 's/^/      /' >&2
        ;;
    esac
  done
  rm -rf "$tmp"
  return "$failed"
}

cmd_push() {
  local all=0
  [ "${1:-}" = "--all" ] && all=1

  info "Copying local skills into the repo"
  "$REPO/scripts/pull-skills.sh" >/dev/null
  git -C "$REPO" add agents/skills
  if ! git -C "$REPO" diff --cached --quiet -- agents/skills; then
    local changed
    changed="$(git -C "$REPO" diff --cached --name-only -- agents/skills |
      cut -d/ -f3 | sort -u | paste -sd ' ' -)"
    git -C "$REPO" commit --quiet -m "skills: sync from $SELF" -m "$changed" -- agents/skills
    ok "committed skills: $changed"
  fi

  if [ "$all" = 1 ]; then
    git -C "$REPO" add -A
    if ! git -C "$REPO" diff --cached --quiet; then
      git -C "$REPO" commit --quiet -m "sync from $SELF"
      ok "committed other changes"
    fi
  elif [ -n "$(git -C "$REPO" status --porcelain)" ]; then
    warn "not pushed, still uncommitted (commit them or use --all):"
    git -C "$REPO" status --short | sed 's/^/      /' >&2
  fi

  info "Pushing"
  git -C "$REPO" pull --quiet --rebase --autostash
  git -C "$REPO" push --quiet
  ok "origin at $(git -C "$REPO" rev-parse --short HEAD)"

  info "Updating other machines"
  # Pull first: a machine with an old checkout has no scripts/update.sh yet.
  on_all "git pull --quiet --rebase --autostash && ./scripts/update.sh"
}

cmd_pull() {
  "$REPO/scripts/update.sh"
}

cmd_status() {
  git -C "$REPO" fetch --quiet origin || true
  ok "origin: $(git -C "$REPO" log -1 --format='%h %s (%cr)' '@{u}')"
  ok "$SELF: $(git -C "$REPO" log -1 --format='%h %s (%cr)')"
  on_all "git log -1 --format='%h %s (%cr)'"
}

cmd_autoupdate() {
  [ "$(uname -s)" = Linux ] || die "autoupdate uses systemd, so it works on Linux only"
  local dir="$HOME/.config/systemd/user"

  if [ "${1:-}" = off ]; then
    systemctl --user disable --now su-update.timer 2>/dev/null || true
    rm -f "$dir/su-update.service" "$dir/su-update.timer"
    systemctl --user daemon-reload
    ok "autoupdate removed"
    return
  fi

  mkdir -p "$dir"
  cat >"$dir/su-update.service" <<EOF
[Unit]
Description=Pull the su repo and apply skills and config

[Service]
Type=oneshot
ExecStart=$REPO/scripts/update.sh
EOF
  cat >"$dir/su-update.timer" <<'EOF'
[Unit]
Description=Update the su repo at boot and every hour

[Timer]
OnBootSec=1min
OnUnitActiveSec=1h

[Install]
WantedBy=timers.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now su-update.timer >/dev/null
  ok "autoupdate on: at boot and every hour. Log: journalctl --user -u su-update"

  # Without lingering, user timers only run while you are logged in.
  if [ "$(loginctl show-user "$USER" -p Linger --value 2>/dev/null)" != yes ]; then
    loginctl enable-linger "$USER" 2>/dev/null ||
      warn "run 'sudo loginctl enable-linger $USER' so the timer runs at boot without a login"
  fi
}

case "${1:-}" in
  push) shift; cmd_push "$@" ;;
  pull) cmd_pull ;;
  status) cmd_status ;;
  autoupdate) shift; cmd_autoupdate "$@" ;;
  *) sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
