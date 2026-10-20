---
name: draft-pr
description: >-
  Push the current branch and open a draft pull request against the inferred base branch. Only invoke when the user has explicitly requested landing via a pull request (for example via Land Changes or /draft-pr); not for review, preparation, or passing checks alone.
disable-model-invocation: true
metadata:
  delta-action: land
---

# Draft PR

Push the current branch and open it as a **draft** pull request. Never mark it ready, merge it, or push to any other branch. The explicit invocation that loaded this skill is the landing request; do not ask again whether the user wants a pull request.

## Steps

1. Inspect state (read-only): `git status --short`, `git branch --show-current`, `git log --oneline -5`, `git remote -v`. If uncommitted changes exist, stop and ask whether to commit them first (see the `commit` skill) — never smuggle uncommitted work into the push.
2. Determine the base branch; never hardcode one:
   - Prefer an explicit repository policy (`AGENT.md`/`AGENTS.md`, `CONTRIBUTING`, PR templates) when it names the integration branch.
   - Otherwise use the remote's default branch (`refs/remotes/origin/HEAD`, falling back to `main`/`master` detection).
   - If policy and remote default disagree, or no base can be inferred, stop and ask.
3. Sync the feature branch with the base (`git fetch origin <base>` then `git merge origin/<base>`). Resolve merge conflicts automatically only when the intended result is clear; on anything ambiguous, stop, describe the conflict, and wait for the user. Never overwrite unrelated work (no force-push, no history rewrites on shared branches).
4. Run the repository's own fast verification before publishing when it is defined (for example a documented lint/test/typecheck gate or pre-commit hook). A failing gate stops the landing: report the failure and do not open the PR. Starting checks or assuming they will pass is not success.
5. Push with `git push -u origin <branch>` (plain push when upstream already exists). Never force-push.
6. Open the draft PR with `gh pr create --draft --base <base> --title "<type>(<scope>): <subject>" --body "<summary>"`. The title follows conventional commits; the body summarizes the change set and test evidence in a few lines. If the host is not GitHub or `gh` is unauthenticated, stop and report that the changes have not landed.
7. Verify: `gh pr view --json url,isDraft,baseRefName,mergeable` shows the PR as a draft against the intended base. Report the PR URL. If verification fails or required remote checks are pending/failing, report that the changes have not landed and explain the blocker.
