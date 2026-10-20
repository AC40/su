# Symlink config files from the repo so edits on any machine show up in git.

install_dotfiles() {
  info "Linking config files"
  link "$REPO/config/shell/common.sh" "$HOME/.config/shell/common.sh"
  link "$REPO/config/zsh/zshrc" "$HOME/.zshrc"
  link "$REPO/config/bash/bashrc" "$HOME/.bashrc"
  link "$REPO/config/nvim" "$HOME/.config/nvim"
}
