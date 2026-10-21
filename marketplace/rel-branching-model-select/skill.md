# Release Branching Model Selection

**One-line description:** Chooses trunk-based development or long-lived release branches from the number of release lines you actually patch and how often you ship, then applies matching GitHub branch and tag rulesets so the model is enforced, not just written down.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `supported_lines` (integer, required): How many released version lines you ship fixes to at the same time (for example 1 if only the newest release gets fixes, 2 if 2.x and 1.x both get patches).
- `release_cadence` (string, required): `continuous` (release whenever main is green) or `scheduled` (release on a calendar or after a freeze).
- `artifact_kind` (string, optional): `library` (consumers pin versions) or `service` (you deploy it yourself). Defaults to `library`.

---

## Outputs

- `branching_model` (object): `model` (`trunk`, `trunk-with-release-branches`, or `maintenance-branches`), `main_branch`, `release_branch_pattern`, `hotfix_rule`, and the decision table row that selected it.
- `branch_protection_rules` (object[]): Each ruleset applied: name, target (`branch` or `tag`), include pattern, rules, and the `gh api` command used.

---

## Phase 1: Select the Model

### Entry Criteria
- `supported_lines` and `release_cadence` are known. If the user does not know `supported_lines`, count the release lines that received a patch release in the last 12 tags: `git tag --sort=-creatordate | head -n 12`.

### Actions
1. Read the decision table below and pick the FIRST row whose conditions all match. Do not blend rows.

   | Row | `supported_lines` | `release_cadence` | Model | Release branch pattern | Hotfix rule |
   |---|---|---|---|---|---|
   | A | 1 | continuous | `trunk` | none; tag from `main` | Fix on `main` with a `fix:` commit, release the next patch from `main`. |
   | B | 1 | scheduled | `trunk-with-release-branches` | `release/X.Y` cut at freeze, deleted after the next minor ships | Fix on `main` first, then `git cherry-pick -x` onto `release/X.Y`. |
   | C | 2 or more | any | `maintenance-branches` | `X.x` per major line (semantic-release maintenance pattern) or `release/X.Y` per minor line | Fix on the oldest affected line or on `main`, then cherry-pick to every other supported line. |

2. If `artifact_kind` is `service` and row A matched, record that patches are deployments of `main`; no maintenance branch is needed because nobody else runs the old version.
3. Do NOT pick GitFlow (a permanent `develop` branch). None of the changelog tools in this domain (release-please, semantic-release, git-cliff) need it, and it doubles the merge work for every fix.
4. Write `branching_model` with the selected row letter.

### Output
`branching_model` with the selected row.

### Quality Gate
- `branching_model.model` is one of the three values in the table and the row letter is recorded.
- `git rev-parse --verify origin/<main_branch>` succeeds for the recorded `main_branch`.

---

## Phase 2: Apply Rulesets

### Entry Criteria
- `branching_model` exists. `gh auth status` shows a token with admin rights on the repository.

### Actions
1. Create a branch ruleset for `main` (and for the release branch pattern when the model has one). Write the ruleset body to a file `ruleset-main.json`:
   ```json
   {
     "name": "protect-main",
     "target": "branch",
     "enforcement": "active",
     "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
     "rules": [
       {"type": "deletion"},
       {"type": "non_fast_forward"},
       {"type": "pull_request", "parameters": {"required_approving_review_count": 1, "dismiss_stale_reviews_on_push": true, "require_code_owner_review": false, "require_last_push_approval": false, "required_review_thread_resolution": false}}
     ]
   }
   ```
   The approval count is a user policy choice; ask the user and write their number. Then run: `gh api repos/OWNER/REPO/rulesets --method POST --input ruleset-main.json`.
2. For release or maintenance branches, repeat with `"include": ["refs/heads/release/*"]` or `"refs/heads/*.x"` and name `protect-release-branches`.
3. Create a tag ruleset so released tags cannot be moved or deleted: `"target": "tag"`, `"include": ["refs/tags/v*"]`, rules `deletion`, `non_fast_forward`, and `update`. If your release tool pushes tags with a bot token, add that app or role to `bypass_actors` instead of disabling the rule.
4. If required status checks exist, add a `required_status_checks` rule listing the exact check names from `gh pr checks <recent PR number>`. Do not guess check names.
5. Record each ruleset and command in `branch_protection_rules`.

### Output
`branch_protection_rules`.

### Quality Gate
- `gh api repos/OWNER/REPO/rulesets` lists every ruleset in `branch_protection_rules` with `"enforcement": "active"`.
- `gh api repos/OWNER/REPO/rules/branches/main` returns the `deletion`, `non_fast_forward` and `pull_request` rules.

---

## Phase 3: Prove Enforcement

### Entry Criteria
- Rulesets are active.

### Actions
1. On a throwaway tag only, prove tag protection: `git tag v0.0.0-ruleset-probe && git push origin v0.0.0-ruleset-probe`, then `git push origin :refs/tags/v0.0.0-ruleset-probe`. The delete must be rejected. Ask a repository admin to delete the probe tag afterwards through a bypass actor.
2. Do NOT test by force-pushing to `main`. Read the rules endpoint instead (Phase 2 gate).
3. Write the model and hotfix rule into `CONTRIBUTING.md` or `RELEASING.md` in one pull request.

### Output
Enforcement evidence attached to `branch_protection_rules`.

### Quality Gate
- The probe tag deletion output contains a rejection line from the remote (for example `! [remote rejected]`).
- The documentation pull request URL is recorded.

---

## Worked Example

Illustrative. Input: `supported_lines` = 2 (3.x current, 2.x security fixes), `release_cadence` = `continuous`, `artifact_kind` = `library`.

- Phase 1: row C matches. `branching_model` = `{model: "maintenance-branches", main_branch: "main", release_branch_pattern: "2.x", hotfix_rule: "fix on 2.x, cherry-pick -x to main"}`.
- Phase 2: `gh api repos/acme/parser/rulesets --method POST --input ruleset-main.json` returns `{"id": 412233, "name": "protect-main", "enforcement": "active", ...}`; a second ruleset covers `refs/heads/*.x`; a tag ruleset covers `refs/tags/v*`.
- Phase 3: `git push origin :refs/tags/v0.0.0-ruleset-probe` prints `! [remote rejected] v0.0.0-ruleset-probe (push declined due to repository rule violations)`.

---

## Exit Criteria

DONE when one model is selected by a recorded table row, branch and tag rulesets are active and readable through the API, and the hotfix rule is documented in the repository.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User cannot state `supported_lines` | **Adjust**: count lines patched in the last 12 tags and confirm the count with the user. |
| Phase 2 | `gh api` returns 403 or 404 | **Stop**: the token lacks admin rights or the repo slug is wrong; ask for an admin token. Do not fall back to editing settings by guesswork. |
| Phase 2 | Plan does not support rulesets on private repos | **Adjust**: use classic branch protection (`gh api repos/OWNER/REPO/branches/main/protection --method PUT`) and record the gap for tags. |
| Phase 3 | Probe tag deletion succeeds | **Retry**: the tag ruleset include pattern is wrong; fix it to `refs/tags/v*` and repeat. |
| Phase 3 | Release bot cannot push tags after rulesets | **Adjust**: add the bot app to `bypass_actors`; never disable the rule. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
