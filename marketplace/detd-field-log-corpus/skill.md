# Regression Corpus from Field Logs

**One-line description:** Builds a versioned regression corpus from field recordings by validating schema and hash chains, deduplicating by input-stream hash, scrubbing personal data that does not feed the decision, selecting logs by limit proximity, incidents and coverage gain, labeling each expectation as recorded or corrected, and storing it with Git LFS or DVC behind a manifest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `field_logs_dir` (string, required): Directory of field recordings in boundary record format.
- `record_schema` (object, required): Output of `detd-boundary-record-schema`.
- `replay_harness` (object, required): Output of `detd-replay-harness-bitexact`.

---

## Outputs

- `regression_corpus` (string): Path of the corpus directory under version control.
- `corpus_manifest` (object[]): Per entry: `id`, `sha256` of file, `input_sha256` of the input stream, `source` (vehicle or bench id, date), `schema_version`, `recorded_commit`, `label` (`as_recorded` or `corrected`), `label_ref` (review or change request), `selection_reason`, `scrub_actions`.

---

## Phase 1: Validate and Deduplicate

### Entry Criteria
- `field_logs_dir` exists; the harness checker runs.

### Actions
1. List files: `find <field_logs_dir> -type f \( -name '*.jsonl*' -o -name '*.bin' -o -name '*.mcap' \)` and count them.
2. Run the harness in verify-only mode on each. Files with chain breaks are rejected; files with gaps are split at the gaps into separate candidates, each starting where a snapshot or tick 0 allows.
3. Compute `input_sha256` over the canonical bytes of all batches and `now_ns` values only (not outputs, not meta). Two files with the same `input_sha256` are duplicates; keep one.

### Output
Validated, deduplicated candidate list.

### Quality Gate
- Rejected count plus accepted count plus duplicate count equals the file count from step 1.

---

## Phase 2: Scrub Personal Data

### Entry Criteria
- Candidates validated.

### Actions
1. Identify personal data fields: VIN, GPS latitude and longitude, wall-clock timestamps in meta, driver or operator ids, camera frames with faces or plates.
2. Decision table:

| Field feeds the decision? | Action |
|---|---|
| No | Remove or replace with a stable pseudonym (for example HMAC of the value with a corpus key kept outside the repo) |
| Yes | Cannot be altered without changing replay. Keep, restrict corpus access, and record the access rule in the manifest |
| Unknown | Treat as yes |

3. After scrubbing, re-hash the chain and run the harness in `regression` mode; outputs must be identical to before scrubbing. If not, a scrubbed field fed the decision: revert that scrub.

### Output
Scrubbed candidates.

### Quality Gate
- Every candidate's harness result after scrubbing is `identical`.
- `rg -n '<VIN pattern or known VIN>'` over the corpus returns nothing for removed fields.

---

## Phase 3: Select, Label and Store

### Entry Criteria
- Scrubbed candidates.

### Actions
1. Selection, in this order, each with `selection_reason`:
   1. Every log tied to a field incident or defect report.
   2. Every log where any limit input came within the adjacent-value band of a limit, or any limit triggered (computed by replaying with trace).
   3. Coverage gain: measure decision code coverage per log (`coverage run -m replay.harness ...` then `coverage json` for Python; `llvm-cov export` or `gcovr --json` for C++), then add logs greedily while each adds at least one uncovered branch. Record the coverage tool and version.
2. Labels: `as_recorded` means the recorded outputs are the expectation (what the code did then). `corrected` means a reviewer determined the right output differs and wrote it, with `label_ref`. Recorded field behavior is not automatically correct; logs tied to incidents need review before labeling.
3. Store: Git LFS (`git lfs track "corpus/**/*.jsonl.zst"`, commit `.gitattributes`) or DVC (`dvc add corpus/`, commit the `.dvc` file and push data to the configured remote). Commit the manifest as JSON.
4. Run the harness over the whole corpus once; record the result per entry.

### Output
`regression_corpus`, `corpus_manifest`.

### Quality Gate
- Every manifest entry has `label`, `selection_reason` and `sha256` that matches `sha256sum` of the stored file.
- Full corpus harness run exits 0, or every non-identical entry has a defect id.

---

## Worked Example

Illustrative only. 412 field files: 3 rejected (chain break), 37 duplicates, 372 accepted. GPS feeds the geofence decision, so it is kept and the corpus is access-restricted; VIN removed. Selection: 6 incident logs, 41 near-limit logs, 18 coverage-gain logs, 65 entries total. `dvc add corpus/` and commit. Harness: 65 identical.

---

## Exit Criteria

DONE when the corpus holds validated, deduplicated, scrubbed, labeled entries with reasons, stored under version control with a manifest that matches file hashes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Schema version too old for the harness | **Adjust**: write a converter with its own round-trip test, or exclude with reason. |
| Phase 2 | Scrub changes outputs | **Retry**: revert that scrub; the field feeds the decision. |
| Phase 3 | Incident log cannot be labeled | **Return**: keep it out of the gate set and list it as an open review item. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
