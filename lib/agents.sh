# Agent skills and the global AGENTS.md.
#
# Skills are copied into ~/.agents/skills (files the skill created locally,
# like r2-images/.env, are left alone), and ~/.claude/skills/<name> symlinks
# to the ~/.agents copy.

install_agents() {
  info "Installing agent skills"
  mkdir -p "$HOME/.agents/skills" "$HOME/.claude/skills"

  local dir name
  for dir in "$REPO"/agents/skills/*/; do
    name="$(basename "$dir")"
    # A symlink here would make rsync write through to wherever it points.
    if [ -L "$HOME/.agents/skills/$name" ]; then
      backup "$HOME/.agents/skills/$name"
    fi
    rsync -a "$dir" "$HOME/.agents/skills/$name/"
    link "$HOME/.agents/skills/$name" "$HOME/.claude/skills/$name" >/dev/null
  done
  ok "$(ls -d "$REPO"/agents/skills/*/ | wc -l | tr -d ' ') skills installed"

  info "Linking AGENTS.md"
  link "$REPO/agents/AGENTS.md" "$HOME/.agents/AGENTS.md"
  link "$REPO/agents/AGENTS.md" "$HOME/.claude/CLAUDE.md"
}
