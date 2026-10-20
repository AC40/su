---
name: commit
description: >-
  Commit working-tree changes with a gitmoji conventional-commit message, without pushing. Only invoke when the user has explicitly requested landing the working tree as a commit (for example via Land Changes or /commit); not for review, preparation, or passing checks alone.
disable-model-invocation: true
metadata:
  delta-action: land
---

# Commit

Land the working tree as a single commit on the current branch. Do not push, open a pull request, or merge. The explicit invocation that loaded this skill is the landing request; do not ask again whether the user wants to commit.

## Steps

1. Inspect state (read-only): `git status --short`, `git branch --show-current`, `git log --oneline -5`. If there is nothing to commit, report that and stop.
2. Secrets guard: never stage a file that may hold a real secret (`.env` / `.env.local` with values, `*.pem`/`*.key`, tokens, service-account JSON). Template files such as `.env.example` are fine. If a suspect file is in the change set, stop and ask before staging it.
3. Stage the change set: `git add -A`, or only the user-scoped paths when the request scoped them. Never use `--no-verify`, `--no-guard`, or any flag that skips the repo's hooks.
4. Write the message from the diff and recent history (`git log --oneline -10` for the repo's style):
   - Format: `<gitmoji> <type>(<scope>): <subject>` — for example `✨ feat(tender): add retry action`.
   - `type` is a lowercase conventional-commit type (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, …); `scope` is the affected area, omitted when there is none.
   - Subject is imperative mood, at most 72 characters, no trailing period.
   - Add a body only when the change needs explanation beyond the subject.
5. Commit non-interactively: `git commit -m "<message>"`, or via a temp file with `git commit -F <file>` for a multi-line message. Never run bare `git commit` (it opens an editor). Do not amend another author's commit.
6. Verify: `git status --short` shows a clean tree (apart from ignored/untracked files deliberately left out) and `git log -1 --stat` shows the new commit. Report the commit hash and subject. If verification fails, report that the changes have not landed and why.
