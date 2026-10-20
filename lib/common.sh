# Shared helpers, sourced by setup.sh.

BACKUP_DIR="$HOME/.setup-backup/$(date +%Y%m%d-%H%M%S)"

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m !!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31merr\033[0m %s\n' "$*" >&2; exit 1; }

has() { command -v "$1" >/dev/null 2>&1; }

# Move an existing file/dir out of the way before we replace it.
backup() {
  local target="$1"
  [ -e "$target" ] || [ -L "$target" ] || return 0
  mkdir -p "$BACKUP_DIR"
  mv "$target" "$BACKUP_DIR/"
  warn "backed up $target -> $BACKUP_DIR/$(basename "$target")"
}

# link SRC DST: symlink DST to SRC, backing up whatever was at DST.
link() {
  local src="$1" dst="$2"
  if [ -L "$dst" ] && [ "$(readlink "$dst")" = "$src" ]; then
    ok "$dst already linked"
    return 0
  fi
  backup "$dst"
  mkdir -p "$(dirname "$dst")"
  ln -s "$src" "$dst"
  ok "linked $dst -> $src"
}
