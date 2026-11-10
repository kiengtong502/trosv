# Dependabot Noise Reduction & PR Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Dependabot to bundle minor/patch updates into single PRs, ignore breaking semver-major updates, group docker and actions updates, and close 9 existing noisy Dependabot PRs.

**Architecture:** Update `.github/dependabot.yml` with group patterns, semver-major ignore rules, and `open-pull-requests-limit: 1`. Clean up existing Dependabot pull requests using GitHub CLI.

**Tech Stack:** GitHub Dependabot v2, YAML, GitHub CLI (`gh`).

**Spec:** [docs/superpowers/specs/2026-11-10-dependabot-optimization-design.md](file:///home/user/Projects/trosv/docs/superpowers/specs/2026-11-10-dependabot-optimization-design.md)

## Global Constraints

- Commit convention: Conventional commits in Vietnamese without diacritics.
- Never touch human PRs (#51, #83).
- Preserve existing comment headers and documentation integrity in `.github/dependabot.yml`.
- Valid YAML syntax that conforms to GitHub Dependabot v2 specification.

## Review Focus

- Invalid YAML syntax in `.github/dependabot.yml`: verified via YAML parser.
- Accidental closing of human PRs: explicitly filter for PR IDs 84 through 92.
- Dependabot config missing ecosystems: ensure composer, npm, pip, docker (3 locations), and github-actions are all covered.
- Duplicate or overlapping group patterns: verify pattern specificity.
- Limit violations: `open-pull-requests-limit: 1` applied across all update configurations.

---

### Task 1: Update `.github/dependabot.yml` Configuration

**Files:**
- Modify: `.github/dependabot.yml`

**Interfaces:**
- Consumes: Existing `.github/dependabot.yml` definitions
- Produces: Updated Dependabot v2 config with `ignore` for `semver-major`, `open-pull-requests-limit: 1`, and groups for docker/actions

- [x] **Step 1: Check existing `.github/dependabot.yml`**

Read [.github/dependabot.yml](file:///home/user/Projects/trosv/.github/dependabot.yml) to verify current contents and line ranges.

- [x] **Step 2: Update `.github/dependabot.yml`**

Apply the following changes:
- For `composer` (/apps/api), `npm` (/apps/web), and `pip` (/apps/ai-service):
  - Set `open-pull-requests-limit: 1`
  - Set `groups.minor-and-patch.patterns: ["*"]`
  - Set `groups.minor-and-patch.update-types: ["minor", "patch"]`
  - Add:
    ```yaml
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
    ```
- For `docker` (/apps/api, /apps/web, /apps/ai-service):
  - Set `open-pull-requests-limit: 1`
  - Add:
    ```yaml
    groups:
      docker-dependencies:
        patterns: ["*"]
    ```
- For `github-actions` (/):
  - Set `open-pull-requests-limit: 1`
  - Add:
    ```yaml
    groups:
      actions:
        patterns: ["*"]
    ```

- [x] **Step 3: Verify YAML syntax and schema correctness**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/dependabot.yml'))"`
Expected: Exit code 0 with no syntax errors.

- [x] **Step 4: Commit changes**

Run:
```bash
git add .github/dependabot.yml docs/superpowers/specs/2026-11-10-dependabot-optimization-design.md
git commit -m "chore(ci): toi uu cau hinh dependabot va han che so luong pr"
```

---

### Task 2: Close Obsolete Dependabot PRs

**Files:**
- None (Remote PR state via `gh` CLI)

**Interfaces:**
- Consumes: Open PR list from GitHub
- Produces: Closed PRs #84 through #92 with explanatory comment

- [x] **Step 1: Verify PR list to confirm targets**

Run: `gh pr list --state open`
Expected: Target PRs are #84, #85, #86, #87, #88, #89, #90, #91, #92. Confirm PRs #51 and #83 are NOT included in the closing target list.

- [x] **Step 2: Close PRs #84 through #92**

Run:
```bash
for pr in 84 85 86 87 88 89 90 91 92; do
  gh pr close "$pr" --comment "Dong PR de Dependabot tao lai PR tong hop theo cau hinh moi (gom nhom va bo qua major bump)."
done
```

- [x] **Step 3: Verify only human PRs remain open**

Run: `gh pr list --state open`
Expected: Only human PRs (e.g. #51, #83) remain open.

---

### Task 3: Final Verification & Status Check

**Files:**
- Modify: `docs/superpowers/plans/2026-11-10-dependabot-optimization.md` (mark tasks complete)

**Interfaces:**
- Consumes: Local git status and remote state
- Produces: Clean git status on working branch

- [x] **Step 1: Check git status and log**

Run: `git status` and `git log -1`
Expected: Working tree clean, last commit reflects the Dependabot configuration update.
