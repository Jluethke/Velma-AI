# Parity Report

**One-line description:** Writes the parity report of record for one port version: what was compared, on which environments, under which policy, the pass or fail result per field, every open question, and the hashes that let anyone reproduce it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `comparison_results` (object, required): Output of `parity-ulp-compare`.
- `triage_findings` (object[], required): Output of `parity-divergence-triage`.
- `env_fingerprint` (object, required): Output of `parity-env-fingerprint`.
- `golden_manifest` (string, required): Output of `parity-golden-manifest-lock`.
- `matrix_results` (object[], optional): Output of `parity-compiler-flag-matrix`; absent when no matrix was run (for example an MSVC-only port).
- `cross_arch_results` (object, optional): Output of `parity-cross-arch-aarch64`; absent when no aarch64 run was requested.

---

## Outputs

- `parity_report` (object): `parity_report.json` (machine-readable) and `parity_report.md` (human-readable) with identical numbers.

---

## Phase 1: Assemble the Record

### Entry Criteria
- All required inputs exist and come from the same reference and port commits.

### Actions
1. Check commit consistency: the reference and port commit hashes in `comparison_results`, `golden_manifest` (via `generator_info.json`), and `env_fingerprint` must match. If not, stop.
2. Build `parity_report.json` with these keys: `reference_commit`, `port_commit`, `golden_sha256` (hash of `golden.sha256` itself), `policy` (copy of the comparison policy), `environments` (one per fingerprint with its hash), `results` (per entry point, field, environment: cases, mismatches, max ULP, mode, bound), `matrix` (copy of `matrix_results`), `cross_arch` (copy or `null`), `triage` (copy of `triage_findings`), `open_questions` (every open question from all inputs), `verdict`.
3. Verdict rule: `PASS` only if every field in every environment has zero mismatches under its policy and no field is in report-only mode. `PASS_WITH_OPEN_QUESTIONS` if mismatches are zero but some field is report-only. Otherwise `FAIL`.

### Output
`parity_report.json`.

### Quality Gate
- `python -m json.tool parity_report.json` succeeds.
- The verdict follows the rule in step 3 when recomputed from `results` by a script.

---

## Phase 2: Render for Readers

### Entry Criteria
- JSON report exists.

### Actions
1. Generate `parity_report.md` from the JSON with a script, never by hand, so numbers cannot drift. Sections: Summary (verdict, commits, golden hash), Environments table, Results table, Matrix table, Cross-architecture table, Triage table, Open questions.
2. State scope plainly: which entry points, which input domain, which environments. Do not state parity for anything not in the report.
3. Do not describe the result as certification or compliance with any standard. Cite standards by number only where the policy uses them (for example IEEE 754-2019 clause 5).
4. Store both files beside the build artifacts for that port commit.

### Output
`parity_report`.

### Quality Gate
- Every number in `parity_report.md` appears in `parity_report.json` (check with the generating script's self-test).
- The Open questions section lists every `open_question` entry from the JSON.

---

## Worked Example

Illustrative excerpt of `parity_report.md`:

```
Verdict: PASS_WITH_OPEN_QUESTIONS
Reference 3f2c9a1  Port a81d004  Golden sha256 5e0b...
| entry | field | env | cases | mismatches | max_ulp | mode |
| lowpass.step | y | gcc13-x86_64-glibc2.39 | 5832 | 0 | 0 | bit_exact |
| lowpass.step | y | gcc13-aarch64-glibc2.39 (hardware) | 5832 | 0 | 0 | bit_exact |
| heading.calc | phase | gcc13-x86_64-glibc2.39 | 2000 | 0 | 1 | ulp (report-only) |
Open questions: heading.calc.phase bound lacks an error analysis for the post-atan2 scaling.
```

---

## Exit Criteria

DONE when both report files exist, agree, carry commits and hashes, and give a verdict computed by the stated rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Commit hashes differ between inputs | **Stop**: rerun the stale step on the current commits. |
| Phase 1 | `cross_arch_results` absent | **Adjust**: set `cross_arch` to `null` and list "no aarch64 run" in open questions. |
| Phase 1 | `matrix_results` absent | **Adjust**: set `matrix` to `null` and list "no compiler matrix run" in open questions. |
| Phase 2 | Reader asks to drop an open question | **Return**: open questions stay until resolved by a measurement or an analysis. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
