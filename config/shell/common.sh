# Shared between zsh and bash. Sourced from ~/.zshrc and ~/.bashrc.

path_prepend() { [ -d "$1" ] && export PATH="$1:$PATH"; return 0; }

case "$(uname -s)" in
  Darwin) export PNPM_HOME="$HOME/Library/pnpm" ;;
  *) export PNPM_HOME="$HOME/.local/share/pnpm" ;;
esac

path_prepend "/opt/homebrew/opt/postgresql@15/bin"
path_prepend "$HOME/go/bin"
path_prepend "$HOME/.codeium/windsurf/bin"
path_prepend "$HOME/.t3/bin"
path_prepend "$HOME/.local/bin"                       # Craft Agent, zoxide, bat (Linux)
path_prepend "$HOME/.antigravity/antigravity/bin"
path_prepend "$HOME/.opencode/bin"
# pnpm/codex global shims must win over corepack shims left on other Node versions
path_prepend "$PNPM_HOME/bin"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
if command -v nvm >/dev/null 2>&1; then
  nvm use --silent default >/dev/null
fi

# Vite+ bin (https://viteplus.dev)
[ -f "$HOME/.config/vite-plus/env" ] && . "$HOME/.config/vite-plus/env"

export EDITOR=nvim
alias vim='nvim'

# cloc with sensible defaults (respects .gitignore via git ls-files)
cloc-default() {
  cloc \
    --vcs=git \
    --exclude-ext=json,svg,lock \
    "${@:-.}"
}

wake-ubuntubook() {
  wakeonlan 10:dd:b1:b3:2c:9f
}

wake-al() {
  ssh bp wakeonlan 1c:1b:0d:9e:d8:b5
}

# oh-my-zsh defines these; bash needs its own.
if ! type git_main_branch >/dev/null 2>&1; then
  git_main_branch() {
    local b
    for b in main trunk mainline default master; do
      git show-ref -q --verify "refs/heads/$b" && { echo "$b"; return; }
    done
    echo main
  }
fi
if ! type git_develop_branch >/dev/null 2>&1; then
  git_develop_branch() {
    local b
    for b in dev devel develop development; do
      git show-ref -q --verify "refs/heads/$b" && { echo "$b"; return; }
    done
    echo develop
  }
fi

# Git command shortcuts (excerpt taken from omz's git plugin)
alias grt='cd "$(git rev-parse --show-toplevel || echo .)"'
alias g='git'
alias ga='git add'
alias gaa='git add --all'
alias gapa='git add --patch'
alias gau='git add --update'
alias gav='git add --verbose'
alias gst='git status'

alias gb='git branch'
alias gbm='git branch --move'
alias gbnm='git branch --no-merged'
alias gbr='git branch --remote'
alias gbg='LANG=C git branch -vv | grep ": gone\]"'
alias gco='git checkout'
alias gcor='git checkout --recurse-submodules'
alias gcb='git checkout -b'
alias gcB='git checkout -B'
alias gcd='git checkout $(git_develop_branch)'
alias gcm='git checkout $(git_main_branch)'
alias gcp='git cherry-pick'
alias gcpa='git cherry-pick --abort'
alias gcpc='git cherry-pick --continue'
alias gclean='git clean --interactive -d'

alias gcam='git commit --all --message'
alias gcas='git commit --all --signoff'
alias gcasm='git commit --all --signoff --message'
alias gcmsg='git commit --message'
alias gcsm='git commit --signoff --message'
alias gc='git commit --verbose'
alias gca='git commit --verbose --all'
alias gca!='git commit --verbose --all --amend'
alias gcan!='git commit --verbose --all --no-edit --amend'
alias gcans!='git commit --verbose --all --signoff --no-edit --amend'
alias gcann!='git commit --verbose --all --date=now --no-edit --amend'
alias gc!='git commit --verbose --amend'
alias gcn='git commit --verbose --no-edit'
alias gcn!='git commit --verbose --no-edit --amend'
alias gcs='git commit -S'
alias gcss='git commit -S -s'
alias gcssm='git commit -S -s -m'
alias gcf='git config --list'
alias gcfu='git commit --fixup'
alias gdct='git describe --tags $(git rev-list --tags --max-count=1)'
alias gd='git diff'
alias gdca='git diff --cached'
alias gdcw='git diff --cached --word-diff'
alias gds='git diff --staged'
alias gdw='git diff --word-diff'
alias gdv='git diff -w "$@" | view -'
alias gdup='git diff @{upstream}'

alias gm='git merge'
alias gl='git pull'
alias gpr='git pull --rebase'
alias gp='git push'
alias ggp='git push origin'
alias gf='git fetch'

alias gwa='git worktree add'
alias gwt='git worktree'
alias gwtls='git worktree list'
alias gwtmv='git worktree move'
alias gwtrm='git worktree remove'
alias gwta='git worktree add'

alias glg='git log'
