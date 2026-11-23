---
name: env-files
description: Use when handling env files.
---

# Env files

Any value in tool output is leaked (transcript, logs). No command may print anything from a value. Redacting with sed or awk counts too: it misses quoted values.

- **Analyze:** key names only (`grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env | tr -d =`). Classify a value by printing your own label (`PROD`/`other`) from awk or python. Compare values by short hash with quotes stripped. Never `cat`, `head`, `grep` lines, `echo $VAR`, `env` or `printenv`.
- **Update:** `cp -p .env .env.bak-$(date +%Y%m%d)` first. Edit with a script that prints only the changed key names. Secrets never go on the command line; pass them by file or stdin.
- **Transfer:** file to file, never through the terminal: `scp host:p/.env .env.tmp && mv .env.tmp .env` or `ssh host 'cat p/.env' > .env`. Back up the target first, then `chmod 600` and `git check-ignore -q .env`.
- **Leaked anyway:** tell the user at once which secret and where, recommend rotating it, never repeat it.
