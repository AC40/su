# CLI tools for every machine: gh, zoxide, bat, nvim, t3, tailscale, spf.
# Plus what the shell config expects: zsh, oh-my-zsh, direnv.

install_cli_mac() {
  if ! has brew; then
    info "Installing Homebrew"
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"

  info "Installing CLI tools via Homebrew"
  brew install gh zoxide bat neovim superfile direnv

  # Tailscale and T3 Code ship their CLIs inside the desktop apps.
  install_cask tailscale-app "Tailscale"
  install_cask t3-code "T3 Code (Beta)"

  install_oh_my_zsh
}

install_cli_linux() {
  has apt-get || die "Only Debian/Ubuntu (apt) is supported on Linux for now."

  local arch
  case "$(uname -m)" in
    x86_64) arch=x86_64 ;;
    aarch64 | arm64) arch=arm64 ;;
    *) die "Unsupported architecture: $(uname -m)" ;;
  esac

  mkdir -p "$HOME/.local/bin"
  export PATH="$HOME/.local/bin:$PATH"

  info "Installing base packages"
  sudo apt-get update -y
  sudo apt-get install -y curl git zsh unzip rsync ca-certificates bat direnv

  # Debian ships bat as `batcat`.
  if ! has bat && has batcat; then
    ln -sf "$(command -v batcat)" "$HOME/.local/bin/bat"
  fi

  if ! has gh; then
    info "Installing gh"
    sudo mkdir -p -m 755 /etc/apt/keyrings
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
    sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
    sudo apt-get update -y
    sudo apt-get install -y gh
  fi

  if ! has zoxide; then
    info "Installing zoxide"
    curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh
  fi

  # apt's neovim is usually too old, so use the official release tarball.
  if ! has nvim; then
    info "Installing neovim"
    local tmp
    tmp="$(mktemp -d)"
    curl -fsSL -o "$tmp/nvim.tar.gz" \
      "https://github.com/neovim/neovim/releases/latest/download/nvim-linux-$arch.tar.gz"
    sudo rm -rf "/opt/nvim-linux-$arch"
    sudo tar -C /opt -xzf "$tmp/nvim.tar.gz"
    sudo ln -sf "/opt/nvim-linux-$arch/bin/nvim" /usr/local/bin/nvim
    rm -rf "$tmp"
  fi

  if ! has tailscale; then
    info "Installing tailscale"
    curl -fsSL https://tailscale.com/install.sh | sh
  fi

  if ! has spf; then
    info "Installing superfile (spf)"
    bash -c "$(curl -sLo- https://superfile.dev/install.sh)"
  fi

  if ! has t3; then
    info "Installing T3 Code CLI"
    ensure_node
    npm install -g t3
  fi

  install_oh_my_zsh

  if [ "$(basename "${SHELL:-}")" != "zsh" ]; then
    info "Changing login shell to zsh"
    sudo chsh -s "$(command -v zsh)" "$USER" || warn "chsh failed; run: chsh -s $(command -v zsh)"
  fi
}

# Node via nvm (the shell config already loads nvm). Needed for `npm install -g t3`.
ensure_node() {
  export NVM_DIR="$HOME/.nvm"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    info "Installing nvm"
    PROFILE=/dev/null bash -c "$(curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh)"
  fi
  # nvm isn't safe under `set -eu`.
  set +eu
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  if ! nvm ls default >/dev/null 2>&1; then
    nvm install --lts
    nvm alias default 'lts/*'
  fi
  nvm use --silent default
  set -eu
}

install_oh_my_zsh() {
  if [ -d "$HOME/.oh-my-zsh" ]; then
    ok "oh-my-zsh already installed"
    return 0
  fi
  info "Installing oh-my-zsh"
  RUNZSH=no CHSH=no KEEP_ZSHRC=yes \
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
}

# install_cask CASK "App Name": skip if the app is already in /Applications,
# e.g. when it was installed by hand or from the App Store.
install_cask() {
  local cask="$1" app="$2"
  if [ -d "/Applications/$app.app" ]; then
    ok "$app already installed"
    return 0
  fi
  info "Installing $app"
  brew install --cask "$cask" || warn "failed to install $cask"
}
