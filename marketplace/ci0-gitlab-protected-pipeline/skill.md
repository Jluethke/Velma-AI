# GitLab Protected Branches, Variables and Pinned Includes

**One-line description:** Makes the GitLab pipeline a merge gate and hardens its secrets: protected default branch, "Pipelines must succeed", protected and masked CI/CD variables, `CI_JOB_TOKEN` scope, and `include:` and `image:` references pinned to commit SHAs and digests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gitlab_project_path` (string, required): Project path such as `group/subgroup/project` (URL-encode `/` as `%2F` in API calls).
- `default_branch` (string, required): Branch to protect.
- `gitlab_ci_path` (string, required): Pipeline file.

---

## Outputs

- `gitlab_protection_record` (object): `{protected_branch_json, merge_settings_json, variables_audit[], include_pins[], image_pins[], blocked_mr_evidence}`.

---

## Phase 1: Merge Gate

### Entry Criteria
- The caller has the Maintainer role or higher: `glab api "projects/<enc_path>" | jq '.permissions'`.

### Actions
1. Read current protection: `glab api "projects/<enc_path>/protected_branches"`.
2. If the default branch is not protected, protect it: `glab api -X POST "projects/<enc_path>/protected_branches" -f name=<default_branch> -f push_access_level=0 -f merge_access_level=40`. Access levels: 0 no one, 30 Developer, 40 Maintainer. The levels are the user's choice; show them the table and ask.
3. Require a green pipeline to merge: `glab api -X PUT "projects/<enc_path>" -f only_allow_merge_if_pipeline_succeeds=true`. Optional, user's choice: `only_allow_merge_if_all_discussions_are_resolved=true`.
4. Note for the user: with this setting, a merge request whose pipeline is skipped by `rules` cannot merge unless "Skipped pipelines are considered successful" (`allow_merge_on_skipped_pipeline`) is enabled. Ask before changing it.
5. Do not remove an existing protection to recreate it; if it exists with different levels, report the difference and change it only with approval (`PATCH` the protected branch).

### Output
Protected branch and merge settings.

### Quality Gate
- `glab api "projects/<enc_path>" | jq .only_allow_merge_if_pipeline_succeeds` prints `true`.
- `protected_branches` output lists `default_branch`.

---

## Phase 2: Variables and Job Token

### Entry Criteria
- Merge gate applied.

### Actions
1. List variables without values: `glab api "projects/<enc_path>/variables" | jq -r '.[] | [.key,.protected,.masked,.environment_scope,.variable_type] | @tsv'`. Do not print `.value`.
2. Apply this table per variable:

| Variable used by | Required flags |
|---|---|
| Deploy or release jobs only | `protected: true` (only pipelines on protected branches or tags get it), `masked: true`, `environment_scope` set to the deploy environment |
| Every pipeline (for example a read-only registry token) | `masked: true`; protected only if MR pipelines from unprotected branches do not need it |
| File-type secret (certificate, kubeconfig) | `variable_type: file`; never echo `$VAR` contents |

3. Masking requires the value to meet GitLab's masking rules (single line, minimum length, allowed characters, per the GitLab CI/CD variables docs). If a value cannot be masked, report it; do not leave it unmasked silently.
4. Update flags only, never values: `glab api -X PUT "projects/<enc_path>/variables/<KEY>" -f protected=true -f masked=true`. Check that your GitLab version accepts updating these flags without a value; if it requires `value`, hand the command to the user to run.
5. Forks: merge request pipelines from forks run in the fork's project by default and do not receive the parent's variables. Do not change that to run them in the parent without the user's explicit decision.
6. Job token: read the allowlist `glab api "projects/<enc_path>/job_token_scope"` and report if inbound access is open to all projects.

### Output
`variables_audit[]`.

### Quality Gate
- Every deploy-only variable shows `protected=true` and `masked=true` in a fresh listing, or has a recorded reason.
- No command in this phase printed a variable value.

---

## Phase 3: Pin Includes and Images

### Entry Criteria
- Variables audited.

### Actions
1. Find external references: `grep -nE '^\s*(include:|- (project|remote|template|component):|\s+ref:|image:)' <gitlab_ci_path>`.
2. Pin with this table:

| Reference | Pinned form |
|---|---|
| `include: project:` with `ref: main` or a tag | `ref: <40-char commit SHA>` from `glab api "projects/<enc_included>/repository/commits/<ref>" | jq -r .id`, with a `# <tag>` comment |
| `include: remote: https://...` | Replace with a `project:` include pinned by SHA, or vendor the file into the repo; a remote URL cannot be pinned |
| `include: component: .../name@1.2.0` | Use the exact version or SHA the component catalog lists; avoid `@~latest` |
| `image: name:tag` | `image: name:tag@sha256:<digest>` from `docker buildx imagetools inspect name:tag` |

3. Run `glab ci lint` after each file edit.
4. Push to a branch with a draft MR, then prove the gate: make the pipeline fail with a throwaway change and confirm the MR cannot merge: `glab mr view <iid> -F json | jq '.detailed_merge_status'` (expect a value such as `ci_must_pass` or `ci_still_running`; read the API docs for the full list). Delete the branch afterward.

### Output
`gitlab_protection_record`.

### Quality Gate
- The grep from step 1 shows no `ref:` that is not 40 hex characters and no `image:` without `@sha256:`.
- `detailed_merge_status` of the failing MR is not `mergeable`.

---

## Worked Example

Illustrative only. `gitlab_project_path=acme/billing`, includes `project: acme/ci-templates, ref: v3, file: /python.yml`.

Phase 1: branch `main` already protected (push Maintainer). `only_allow_merge_if_pipeline_succeeds` was `false`; set to `true` after approval.
Phase 2: `PYPI_TOKEN  false  true  *  env_var` used only by the release job: set `protected=true`, scope `release`.
Phase 3: `glab api "projects/acme%2Fci-templates/repository/commits/v3" | jq -r .id` prints `5b0c...e91`; include becomes `ref: 5b0c...e91 # v3`. Failing MR shows `detailed_merge_status: "ci_must_pass"`.

---

## Exit Criteria

DONE when the default branch is protected, merges require a passing pipeline, deploy secrets are protected and masked, includes and images are pinned, and a failing MR is shown unmergeable.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | 403 on settings API | **Return**: give the exact commands to a Maintainer or Owner. |
| Phase 2 | Value cannot be masked | **Return**: report; suggest a file-type variable or rotating to a maskable token format. |
| Phase 3 | Included project's ref is a moving branch with no tag | **Return**: ask the included project's owner for a release tag; pin to the current SHA only with approval. |
| Phase 3 | Pipeline breaks after pinning | **Adjust**: the SHA differs from what the tag used to point at; resolve again and compare. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
