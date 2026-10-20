#!/usr/bin/env bash
# Set up a machine: ./setup.sh [--skip-cli] [--skip-apps] [--skip-dotfiles] [--skip-agents]
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

. "$REPO/lib/common.sh"
. "$REPO/lib/cli.sh"
. "$REPO/lib/mac-apps.sh"
. "$REPO/lib/dotfiles.sh"
. "$REPO/lib/agents.sh"

do_cli=1 do_apps=1 do_dotfiles=1 do_agents=1
for arg in "$@"; do
  case "$arg" in
    --skip-cli) do_cli=0 ;;
    --skip-apps) do_apps=0 ;;
    --skip-dotfiles) do_dotfiles=0 ;;
    --skip-agents) do_agents=0 ;;
    -h | --help)
      sed -n '2p' "$0"
      exit 0
      ;;
    *) die "unknown option: $arg" ;;
  esac
done

case "$(uname -s)" in
  Darwin) os=mac ;;
  Linux) os=linux ;;
  *) die "Unsupported OS: $(uname -s)" ;;
esac
info "Detected $os"

if [ "$do_cli" = 1 ]; then
  if [ "$os" = mac ]; then install_cli_mac; else install_cli_linux; fi
fi

if [ "$do_apps" = 1 ] && [ "$os" = mac ]; then
  install_mac_apps
fi

if [ "$do_dotfiles" = 1 ]; then install_dotfiles; fi
if [ "$do_agents" = 1 ]; then install_agents; fi

info "Done."
[ -d "$BACKUP_DIR" ] && warn "Replaced files were moved to $BACKUP_DIR"
cat <<'EOF'

Next steps:
  gh auth login
  sudo tailscale up        (Linux; on macOS open the Tailscale app)
  open a new shell to load the config
EOF
