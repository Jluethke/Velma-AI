# Measure CI Pipeline Runtime per Job and Step

**One-line description:** Pulls timing data for recent successful CI runs from the GitHub Actions or GitLab API, separates queue time from execution time, computes per-job and per-step medians, and identifies the critical path that sets wall-clock time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ci_platform` (string, required): `github` or `gitlab`.
- `repo_slug` (string, optional): `owner/repo`; required when `ci_platform` is `github`.
- `gitlab_project_path` (string, optional): Project path; required when `ci_platform` is `gitlab`.
- `run_sample_size` (integer, required): Number of recent successful default-branch runs to sample, chosen by the user.

---

## Outputs

- `runtime_report` (object): `{runs_sampled[], wall_clock_median_s, queue_median_s, jobs: [{name, median_s, min_s, max_s}], steps: [{job, step, median_s}], critical_path[], raw_file}`.

---

## Phase 1: Collect Raw Timings

### Entry Criteria
- `gh auth status` (GitHub) or `glab auth status` (GitLab) succeeds.

### Actions
1. GitHub:
   - Runs: `gh run list --repo <repo_slug> --workflow <ci file name> --branch <default_branch> --status success --limit <run_sample_size> --json databaseId,createdAt,updatedAt,headSha > runs.json`.
   - Jobs and steps per run: `gh api repos/<repo_slug>/actions/runs/<id>/jobs --paginate > jobs-<id>.json`. Each job has `created_at`, `started_at`, `completed_at`, `name`, and `steps[]` with `name`, `started_at`, `completed_at`.
2. GitLab:
   - Pipelines: `glab api "projects/<enc_path>/pipelines?ref=<default_branch>&status=success&per_page=<run_sample_size>" > runs.json`.
   - Jobs: `glab api "projects/<enc_path>/pipelines/<pid>/jobs?per_page=100" > jobs-<pid>.json`. Each job has `duration` (seconds running) and `queued_duration` (seconds waiting for a runner). GitLab has no per-step timing in the API; use section markers in the trace if needed (`glab ci trace <job_id> | grep section_`).
3. Only successful runs: a failed run stops early and makes timings look shorter.
4. Save all raw JSON and set `raw_file` to its directory. Do not hand-type any timing.

### Output
Raw JSON per run.

### Quality Gate
- The number of runs in `runs.json` equals `run_sample_size`, or the shortfall is reported.
- Every run has a jobs file.

---

## Phase 2: Compute Durations

### Entry Criteria
- Raw files present.

### Actions
1. GitHub job duration: `completed_at - started_at`; queue time: `started_at - created_at`. Example jq:
```
jq -r '.jobs[] | [.name, ((.completed_at|fromdate)-(.started_at|fromdate)), ((.started_at|fromdate)-(.created_at|fromdate))] | @tsv' jobs-<id>.json
```
2. GitHub step duration: same subtraction on `steps[]`. Steps that were skipped have equal or null timestamps; drop them.
3. GitLab: use `duration` and `queued_duration` directly.
4. Wall clock per run: GitHub `updatedAt - createdAt` from `runs.json` (approximate; includes queue); GitLab pipeline `duration` from `glab api "projects/<enc_path>/pipelines/<pid>"`.
5. Aggregate per job name and per step: median, min, max across runs. Use the median as the headline because single slow runs (runner cold start) skew the mean.
6. Matrix jobs: keep each cell as its own row; also report the slowest cell per matrix.

### Output
Per-job and per-step statistics.

### Quality Gate
- Every statistic is computed from the raw files by a command saved alongside the report.
- No negative durations (a negative value means timestamps were swapped).

---

## Phase 3: Critical Path

### Entry Criteria
- Statistics computed.

### Actions
1. Read the job dependency graph: GitHub `needs:` keys in the workflow (`yq '.jobs | to_entries[] | [.key, (.value.needs // [])]' <workflow>`); GitLab `needs:` per job, or stage order when `needs` is absent.
2. Critical path = the chain of dependent jobs with the largest summed median duration. Jobs not on it can get faster without changing wall-clock time.
3. Within each critical-path job, list the three longest steps by median.
4. Report queue time separately. If median queue time is large relative to execution, the bottleneck is runner capacity, not the pipeline file.

### Output
`runtime_report`.

### Quality Gate
- `critical_path` lists job names that exist in the workflow and form a dependency chain.
- The report separates queue from execution time.

---

## Worked Example

Illustrative only. GitHub, `run_sample_size=20`.

Phase 2 output (excerpt):
```
job                       median_s  min_s  max_s
lint                      62        55     91
test (ubuntu, 3.12)       618       590    702
test (windows, 3.12)      884       850    1012
build                     140       131    166
queue median              9
```
Steps in `test (windows, 3.12)`: `install` 402 s, `test` 431 s, `checkout` 21 s.
Phase 3: `build` needs `test`; critical path `test (windows, 3.12) -> build` = 1,024 s; wall-clock median 1,051 s.

---

## Exit Criteria

DONE when `runtime_report` lists median job and step times from API data for the requested sample, separates queue time, and names the critical path.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fewer successful runs than requested | **Adjust**: use what exists and report the actual count. |
| Phase 1 | API rate limit (HTTP 403 or 429) | **Retry**: after the reset time in the response headers. |
| Phase 2 | Workflow changed during the sample window | **Adjust**: restrict to runs after the last workflow change (`git log -1 --format=%cI -- <workflow>`). |
| Phase 3 | `needs` graph has a job not in runs | **Return**: the job is conditional; report it separately. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
