# LLM Eval Release Report

**One-line description:** Assembles one dated markdown eval report for a system version: what was tested (manifest and dataset hashes), headline results per criterion with n and intervals, the paired comparison against the baseline, stratum table, judge measured error rates, adversarial results, cost and latency, confirmed regressions with examples, and an explicit limitations section, with every number traceable to a file in the run directory.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ci_report` (string, required): From `evh-sample-size-confidence-intervals`.
- `cost_latency_report` (string, required): From `evh-cost-latency-tracking`.
- `regression_triage` (string, required): From `evh-regression-diff-triage`.
- `calibration_report` (string, required): From `evh-judge-calibration`.
- `version_manifest` (string, required): `evals/version_manifest.json` of the candidate run.
- `pairwise_report` (string, optional): From `evh-pairwise-comparison` when it ran.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `eval_report` (string): `evals/reports/<YYYY-MM-DD>-<system_version>.md`, committed, with a link from `evals/reports/INDEX.md`.

---

## Phase 1: Collect and Check Sources

### Entry Criteria
- All required input files exist in the candidate run directory.

### Actions
1. Read `system_version`, model ids, prompt hashes, dataset sha256, harness version and `dirty` from the manifest. If `dirty: true`, the report header must say "not releasable: run from uncommitted changes".
2. Confirm every input report names the same `system_version`. A report mixing runs is wrong; stop and rerun the mismatched piece.
3. Confirm the baseline in `regression_triage` and `ci_report` is the same baseline version.

### Output
A source list with file paths and the shared `system_version`.

### Quality Gate
- `grep -h "system_version" logs/<v>/*.json evals/version_manifest.json | sort -u` shows one value (plus the baseline value where reports name both).

---

## Phase 2: Write the Report

### Entry Criteria
- Sources consistent.

### Actions
1. Use this section order, each section short:
   1. Header: feature, `system_version`, date, baseline version, model ids, dataset hashes, harness and version, decision field (left for the owner).
   2. Summary table: per criterion: n (valid), errors excluded, pass rate, interval and method, baseline pass rate, paired difference with interval or McNemar p-value, gate result (pass or fail).
   3. Critical and adversarial: count of critical items, failures listed by id and attack class.
   4. Strata: per stratum n and pass rate with interval; strata flagged in triage marked.
   5. Judge reliability: for each judge-graded criterion, holdout kappa, TPR and TNR with intervals from `calibration_report`, and `approved`. If a criterion is judge-graded but not approved, its row in the summary is marked "unvalidated".
   6. Pairwise (if run): wins, losses, ties, inconsistent, position-bias rate, p-value.
   7. Cost and latency: per-1,000-request cost, TTFT and total latency p50 and p95 with n, concurrency and price date; eval spend.
   8. Regressions: confirmed regressions grouped by category with one short excerpt per category (inputs redacted of personal data).
   9. Limitations: required n versus available n for each gating criterion; strata too small for intervals; alias (unpinned) model ids; judge same-family flag; latency measurement conditions.
2. Wording rules: write "no detectable regression at n = X" not "no regression"; write the interval with every rate; never round a rate without its n beside it; never call a judge-graded score "accuracy" without its judge error rates in the same report.
3. Do not include prose claims without a source file. Each table caption names the file it came from.

### Output
Draft report.

### Quality Gate
- Every rate in the summary table has n and an interval (check by reading each row).
- `grep -n "no regression" <report>` returns nothing unless preceded by "detectable".
- Every table caption names a source file that exists (`ls` each).

---

## Phase 3: Publish in the Repository

### Entry Criteria
- Draft passes Phase 2 gates.

### Actions
1. Save as `evals/reports/<YYYY-MM-DD>-<system_version>.md`. Add one line to `evals/reports/INDEX.md`: date, version, gate result, link.
2. Commit: `git add evals/reports && git commit -m "evals: report <system_version>"`. Do not commit raw logs with personal data; keep those as CI artifacts.
3. If the release decision is made, the owner writes it in the header decision field in a follow-up commit. The report author does not fill it in for them.

### Output
`eval_report` committed.

### Quality Gate
- `git log -1 --name-only` lists the report and `INDEX.md`.
- The header decision field is empty or filled by the owner, never by the author.

---

## Worked Example

Illustrative only. Candidate v42 (`6c03e1d8f2aa`) vs baseline v41 (`a41f0c9e2b7d`).

- Phase 1: all reports name `6c03e1d8f2aa`; manifest `dirty: false`.
- Phase 2: summary row C2: n 195, 2 errors excluded, 0.923 (cluster bootstrap 0.882 to 0.959), baseline 0.913, McNemar p 0.61, gate pass. Row C3: 0.832, paired p 0.031, gate fail. Critical: `adv-031` fails (indirect injection). Judge C2: kappa 0.82 (0.61 to 0.96), TPR 0.89, TNR 0.97, approved. Limitations: "195 items detect a change of about 0.06, not the 0.03 the owner asked for."
- Phase 3: `evals/reports/2026-10-20-6c03e1d8f2aa.md` committed; INDEX line "2026-10-20 | 6c03e1d8f2aa | gate fail (C3, adv-031)".

---

## Exit Criteria

DONE when the report for one `system_version` is committed, every number has n and an interval and a source file, limitations state the detectable effect size, and the release decision field is left for the owner.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Reports name different system versions | **Stop**: rerun the out-of-date flow on the current run. |
| Phase 1 | Manifest `dirty: true` | **Adjust**: label the report not releasable. |
| Phase 2 | A rate lacks an interval | **Return**: compute it in `evh-sample-size-confidence-intervals`. |
| Phase 3 | Report contains personal data in excerpts | **Stop**: redact before commit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
