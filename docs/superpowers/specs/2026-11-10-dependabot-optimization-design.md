# Design: Dependabot Noise Reduction & PR Consolidation

**Date:** 2026-11-10  
**Topic:** Dependabot Optimization & PR Cleanup  
**Target Base:** `unstable`  

---

## 1. Intent and Why
Prevent Dependabot from flooding the repository with multiple unbundled PRs (specifically major version updates that introduce breaking changes and individual docker/actions updates), while preserving automated, safe minor and patch dependency updates.

---

## 2. Goals, Non-Goals, and Anti-Goals
- **Goals:**
  - Group all `minor` and `patch` updates for package managers (`composer`, `npm`, `pip`) into a single grouped PR per ecosystem.
  - Ignore automated `semver-major` bumps across all dependencies so Dependabot stops opening standalone major bump PRs that fail CI.
  - Add groups to `docker` and `github-actions` updates and enforce `open-pull-requests-limit: 1` everywhere.
  - Close the 9 currently open Dependabot PRs (#84, #85, #86, #87, #88, #89, #90, #91, #92) with a cleanup comment.
- **Non-Goals:**
  - Touching human PRs (#51, #83).
  - Altering application code or package lockfiles manually.
- **Anti-Goals:**
  - Blocking security alerts: Dependabot security alerts (CVE advisories) remain functional and unaffected by version-update ignore rules.

---

## 3. Constraints
- Commit convention: Conventional commits in Vietnamese without diacritics (e.g. `chore(ci): toi uu cau hinh dependabot va gom nhom pr`).
- Do not close or modify non-Dependabot PRs.

---

## 4. Approaches Considered
- **Approach A (Selected): Auto-bundle Minor & Patch, Ignore Major Updates, Cap Limit to 1**
  - Keeps automated dependency updates completely green and low-friction (1 combined PR per ecosystem). Major updates are handled deliberately by developers.
- **Approach B: Bundle Major Updates into a Second Dedicated PR**
  - Keeps 2 PRs per ecosystem (1 minor/patch, 1 major). Dropped because major PRs almost always fail CI and sit stale.
- **Approach C: Single Combined PR for Everything (Major, Minor, Patch)**
  - Dropped because any single breaking major bump would block merging safe minor/patch security updates.

---

## 5. Execution Plan
1. Update [.github/dependabot.yml](file:///home/user/Projects/trosv/.github/dependabot.yml) with:
   - `patterns: ["*"]` and `update-types: ["minor", "patch"]` for `composer`, `npm`, `pip`.
   - `ignore: [{ dependency-name: "*", update-types: ["version-update:semver-major"] }]` on `composer`, `npm`, `pip`.
   - Grouping and `open-pull-requests-limit: 1` on `docker` (api, web, ai-service) and `github-actions`.
2. Close the 9 open Dependabot PRs (#84 to #92) with `gh pr close` leaving a clear reason.
3. Commit and push the configuration to branch / open PR into `unstable`.
