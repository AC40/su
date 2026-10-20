# su

My machine setup. Clone it and run:

```sh
./setup.sh
```

Works on macOS and Debian/Ubuntu. Re-running is safe: anything it replaces gets moved to `~/.setup-backup/<timestamp>/`.

| Step | What it does | Skip with |
| --- | --- | --- |
| cli | gh, zoxide, bat, nvim, t3, tailscale, spf, plus zsh, oh-my-zsh, direnv (Homebrew on macOS, apt and install scripts on Linux) | `--skip-cli` |
| apps | macOS only: the casks in `lib/mac-apps.sh`; apps already in `/Applications` are skipped | `--skip-apps` |
| dotfiles | symlinks `config/zsh/zshrc`, `config/bash/bashrc`, `config/shell/common.sh` and `config/nvim` into `$HOME` | `--skip-dotfiles` |
| agents | copies `agents/skills/*` to `~/.agents/skills`, symlinks each into `~/.claude/skills`, and links `agents/AGENTS.md` to `~/.agents/AGENTS.md` and `~/.claude/CLAUDE.md` | `--skip-agents` |

## Layout

```
setup.sh              entry point
lib/                  one file per step
config/shell/common.sh  PATH, functions, aliases shared by zsh and bash
config/zsh/zshrc      zsh-only bits (oh-my-zsh, hooks)
config/bash/bashrc    bash-only bits
config/nvim/          nvim config
agents/AGENTS.md      global agent instructions
agents/skills/        agent skills
scripts/pull-skills.sh  copy ~/.agents/skills on this machine back into the repo
```

## Notes

- Skill secrets (`.env` files, e.g. for `r2-images`) are gitignored. Recreate them by hand on a new machine.
- After setup: `gh auth login`, then `sudo tailscale up` on Linux or open the Tailscale app on macOS.
