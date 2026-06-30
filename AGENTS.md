# AiBhive — Cloud Agent Instructions

## Pull requests (default workflow)

When the user has not asked for a draft or manual review:

1. **Commit and push** every completed change to `cursor/<descriptive-name>-c577`.
2. **Open PRs as ready for review** (`draft: false`), base branch `main-fixed`.
3. **Auto-merge** after `npm run build` passes:
   ```bash
   gh pr merge <number> --squash --delete-branch
   ```
4. **Update the user** with what shipped and the PR link (merged or open if merge blocked).

Do not wait for the user to ask to push or merge unless they explicitly request a draft or review-only PR.

## Branch naming

All agent branches: `cursor/<descriptive-name>-c577` (lowercase).
