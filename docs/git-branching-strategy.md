# Git Branching Strategy & Coding Best Practices

## Overview

This document outlines the branching conventions and workflow all contributors should follow when working on this project. Consistent branch naming and a clear pull request process keeps the codebase organised, reviewable, and easy to navigate.

---

## Branch Types

### 1. Feature Branches

Any new functionality, module, or use case should be developed on a feature branch. Feature branches are always created from **main**.

**Naming format:**
```
feature/<short-description>
feature/<JIRA-ID>-<short-description>
```

**Examples:**
```
feature/adding-add-tree
feature/JIRA-123-add-tree-description
```

**Rules:**
- Branch off from `main`
- Keep scope focused — one feature per branch
- Delete the branch after it has been successfully merged

---

### 2. Bugfix Branches

Used when code merged from a feature branch has caused an issue in `main` or `dev`, or was rejected during review and requires rework.

**Naming format:**
```
bugfix/<short-description>
bugfix/<JIRA-ID>-<short-description>
```

**Examples:**
```
bugfix/resolve-button-misalignment
bugfix/JIRA-1444-gray-on-blur-fix
```

**Rules:**
- Branch off from `main`
- Reference the original issue or JIRA ticket where possible
- Do not bundle unrelated changes into a bugfix branch

---

### 3. Merge Branches

A temporary branch used to resolve conflicts between two branches before the final merge. This is useful when a long-running feature branch has diverged significantly from `main`, or when two developers need to combine their work before submitting a pull request.

**Naming format:**
```
merge/<description>
```

**Examples:**
```
merge/dev-lombok-refactoring
merge/combined-device-support
```

**Rules:**
- Treat as short-lived — merge and delete as soon as conflicts are resolved
- Do not use merge branches for new development work
- Document what was combined in the PR description

---

## Branch Overview

| Branch Type | Branches From | Merges Into | Purpose |
|-------------|--------------|-------------|---------|
| `feature/*` | `main` | `main` | New functionality |
| `bugfix/*` | `main` | `main` | Fix existing issues |
| `merge/*` | Multiple | Target branch | Conflict resolution |

---

## Workflow: From Task to Merge

### Step-by-step

1. **Pick up a task** — assign the JIRA ticket to yourself and move it to "In Progress".

2. **Create your branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

3. **Develop and commit** regularly with clear, descriptive commit messages:
   ```bash
   git add .
   git commit -m "JIRA-123: Add tree submission form with location picker"
   ```

4. **Keep your branch up to date** with `main` to avoid large conflicts at merge time:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

5. **Push your branch** to the remote:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request (PR) / Merge Request (MR)** targeting `main`.

7. **Request reviewers** — at least one reviewer must approve before the branch can be merged.

8. **Address feedback** — make changes, push additional commits, and re-request review if needed.

9. **Merge** once approved. Prefer **squash merge** for feature branches to keep `main` history clean.

10. **Delete the branch** after a successful merge.

---

## Pull Request Guidelines

### Opening a PR

- Use a descriptive title that summarises the change (e.g. `Add tree submission screen with GPS location`)
- Fill out the PR description including:
  - What was changed and why
  - Any relevant JIRA ticket links
  - Steps to test or reproduce
  - Screenshots for UI changes

### Reviewing a PR

Reviewers are responsible for checking:

- [ ] Code correctness and logic
- [ ] Adherence to project conventions and style
- [ ] No unnecessary files or debug code committed
- [ ] Tests pass (where applicable)
- [ ] No merge conflicts with the target branch

> **At least one approving review is required** before a branch can be merged into `main`.

### Merging

- Do **not** merge your own PRs without a review
- Resolve all comments before merging, or explicitly mark them as acknowledged
- Delete the source branch after merging

---

## Commit Message Format

Good commit messages make the project history readable and searchable.

```
<JIRA-ID>: <Short imperative summary (50 chars max)>

Optional longer description explaining the why, not the what.
Wrap at 72 characters.
```

**Examples:**
```
JIRA-204: Add marker clustering to map screen

JIRA-88: Fix auth token not refreshing on expiry
Previously the app would silently fail after token expiry.
Now it attempts a refresh and redirects to login if that fails.
```

**Tips:**
- Use the imperative mood: "Add", "Fix", "Remove" — not "Added", "Fixed", "Removed"
- Reference JIRA tickets wherever possible
- Keep the first line under 50 characters
