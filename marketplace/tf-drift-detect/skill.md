# Scheduled Drift Detection with refresh-only Plans

**One-line description:** Runs `terraform plan -refresh-only -detailed-exitcode` on a schedule for every root module, separates out-of-band drift (exit 2 on refresh-only) from unapplied code, reports the drifted attributes, and resolves each one by a decision table: codify, revert, or accept into state.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root modules to watch.
- `env_strategy` (object, required): From `tf-env-strategy`; init commands per environment.
- `ci_platform` (string, required): `github` or `gitlab`; where the schedule runs.

---

## Outputs

- `drift_report` (object): Per root module: refresh-only exit code, normal plan exit code, drifted addresses with changed attributes, and the resolution chosen.
- `drift_schedule` (object): The scheduled job file, its schedule (a user input), and where results are posted.

---

## Phase 1: Detect

### Entry Criteria
- A PLAN identity (read-only) can init and plan every root.

### Actions
1. For each root, run both:
```
terraform plan -refresh-only -input=false -lock-timeout=5m -detailed-exitcode -out=refresh.tfplan; echo "refresh_exit=$?"
terraform plan -input=false -lock-timeout=5m -detailed-exitcode -out=full.tfplan; echo "full_exit=$?"
```
2. Read exit codes (`-detailed-exitcode`: 0 no changes, 1 error, 2 changes present):

| refresh_exit | full_exit | Meaning |
|---|---|---|
| 0 | 0 | Clean |
| 0 | 2 | Code merged but not applied (not drift) |
| 2 | any | Real infrastructure differs from state: drift |
| 1 | any | Error: fix credentials or config before reading drift |

3. List drifted objects: `terraform show -json refresh.tfplan | jq -r '.resource_drift[]? | "\(.change.actions|join(",")) \(.address)"'`. For attribute detail read `terraform show -no-color refresh.tfplan`, section "Objects have changed outside of Terraform".
4. Do not apply anything in this phase.

### Output
Draft `drift_report`.

### Quality Gate
- Both exit codes are recorded for every root.
- Every root with refresh_exit 2 has its drifted addresses listed.

---

## Phase 2: Resolve

### Entry Criteria
- Drift listed.

### Actions
1. For each drifted object pick a row (ask the owner of the resource when the reason is unknown):

| Cause | Resolution | Command |
|---|---|---|
| Intended manual change (hotfix) that should stay | Codify: change the `.tf` to match, then normal plan must show no change for it | edit, `terraform plan` |
| Unauthorized or mistaken change | Revert: apply the config | `terraform plan -out=tfplan` then `terraform apply tfplan` after `tf-plan-review` |
| Object deleted outside Terraform | Recreate by apply, or remove from code and state with `tf-state-surgery` | per row |
| Value managed by another system on purpose (autoscaling desired count, tags added by a tagging tool) | Ignore that attribute: `lifecycle { ignore_changes = [desired_count] }` | edit, plan |
| State only needs the new values recorded, config already matches | Accept into state | `terraform apply -refresh-only` and confirm |

2. `ignore_changes` is only for attributes another system owns by design. Never use it to hide drift you do not understand.
3. After resolution, rerun Phase 1 for that root; refresh_exit must be 0.

### Output
Resolutions in `drift_report`.

### Quality Gate
- Every drifted object has a row and an owner-confirmed cause.
- Rerun shows refresh_exit 0 for each resolved root.

---

## Phase 3: Schedule

### Entry Criteria
- Manual run works.

### Actions
1. Schedule value (cron) is a user input; do not choose a frequency for them.
2. GitHub (`ci_platform == github`): `.github/workflows/terraform-drift.yml` with `on: schedule: - cron: "<user cron>"` and `workflow_dispatch`, matrix over roots, PLAN role, the Phase 1 commands, and a step that fails or opens an issue when refresh_exit is 2. Scheduled workflows run on the default branch only.
3. GitLab (`ci_platform == gitlab`): a pipeline schedule (Build, Pipeline schedules) with a variable `DRIFT_CHECK=true`, and a job with `rules: - if: $CI_PIPELINE_SOURCE == "schedule" && $DRIFT_CHECK == "true"`.
4. The drift job never runs `apply`. It uses the read-only identity.
5. Because drift jobs take the state lock briefly, schedule them outside normal apply windows, or rely on `-lock-timeout`.

### Output
`drift_schedule`.

### Quality Gate
- A manual trigger (`workflow_dispatch` or "Run pipeline schedule") completes and its log shows `refresh_exit=` for every root.
- `grep -n 'apply' <drift job file>` finds no `terraform apply` command.

---

## Worked Example

Illustrative. Root `live/prod/app`.

- Phase 1: `refresh_exit=2`, `full_exit=2`. jq prints `update aws_security_group.app` and `update aws_ecs_service.api`. Text shows an added ingress rule from `10.9.0.0/16` and `desired_count` 4 to 7.
- Phase 2: ingress rule added by hand during an incident and should stay: codified in `.tf`. `desired_count` is owned by autoscaling: `ignore_changes = [desired_count]`. Rerun: `refresh_exit=0`.
- Phase 3: GitHub workflow with the user's cron; manual dispatch shows `refresh_exit=0` for both roots.

---

## Exit Criteria

DONE when every root has a recorded drift result, every drifted object has a resolution, and a read-only scheduled job runs the check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | refresh_exit 1 (AccessDenied on a read call) | **Adjust**: add the missing read permission to the PLAN identity; retry. |
| Phase 1 | Lock timeout during an apply window | **Retry**: after the apply finishes. |
| Phase 2 | Cause unknown and owner unreachable | **Stop**: leave drift reported, do not revert blind. |
| Phase 3 | Schedule never fires | **Adjust**: GitHub schedules run only from the default branch and can be disabled after repository inactivity; check the Actions tab. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
