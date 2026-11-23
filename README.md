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
config/machines       machines that su-sync updates over SSH
scripts/sync.sh       the su-sync command
scripts/update.sh     pull the repo and re-apply dotfiles and skills on this machine
scripts/pull-skills.sh  copy ~/.agents/skills on this machine back into the repo
```

## Syncing machines

`setup.sh` adds a `su-sync` shell function. Every machine listed in `config/machines` needs the repo at `~/dev/su` and must accept SSH from the machine you run `su-sync` on.

| Command | What it does |
| --- | --- |
| `su-sync push` | Copies this machine's skills into the repo, commits them, and pushes. Then it uses SSH to run `scripts/update.sh` on every machine in `config/machines`, all at once. Offline machines are skipped. |
| `su-sync push --all` | Same, but also commits every other change in the repo. |
| `su-sync pull` | Updates this machine only. |
| `su-sync status` | Shows the commit that each machine is on. |
| `su-sync autoupdate` | Linux only. Installs a systemd user timer that runs `scripts/update.sh` 1 minute after boot and then every hour. A machine that was off catches up when it starts. `su-sync autoupdate off` removes the timer. To see the log, run `journalctl --user -u su-update`. |

`al` uses `autoupdate`, because it is sometimes switched off.

## Notes

- Skill secrets (`.env` files, e.g. for `r2-images`) are gitignored. Recreate them by hand on a new machine.
- After setup: `gh auth login`, then `sudo tailscale up` on Linux or open the Tailscale app on macOS.
