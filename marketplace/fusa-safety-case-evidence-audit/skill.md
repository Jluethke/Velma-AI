# Safety Case Evidence Audit

**One-line description:** Audits every solution in a GSN safety case against the evidence it cites: the file exists, its hash is recorded, it was produced from the hardware and software revision the case claims, its result actually supports the goal (pass, not fail or partial), and it is newer than the last change to the thing it tests, producing a per-solution verdict and a list of stale or missing evidence.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gsn_yaml` (string, required): Path to the GSN YAML from `fusa-gsn-safety-case-gsn2x`.
- `evidence_index` (object[], required): Evidence list with `id`, `path`, `kind`, `date`.
- `config_baseline` (string, optional): The Git tag or commit and the hardware revision the case is argued for. Without it, Phase 2 asks the user and stops until given.

---

## Outputs

- `evidence_audit` (object[]): `solution_id`, `evidence_id`, `path`, `sha256`, `exists`, `revision_match`, `result_supports_goal`, `fresh`, `verdict` (supported, stale, contradicts, missing), `notes`.

---

## Phase 1: Resolve and Hash Evidence

### Entry Criteria
- `gsn_yaml` exists and renders with `gsn2x` without errors.

### Actions
1. Extract every solution element: `grep -nE "^Sn[0-9]+:" -A2 <gsn_yaml>`. Record the evidence id each one names.
2. Look up each id in `evidence_index`. Missing id: verdict `missing`.
3. For each path, check it exists and hash it: `sha256sum <path>` (PowerShell: `Get-FileHash -Algorithm SHA256 <path>`). Record the hash so later edits to evidence are detectable.

### Output
Solution to evidence table with existence and hashes.

### Quality Gate
- Every solution in the YAML has a row (`grep -cE "^Sn[0-9]+:" <gsn_yaml>` equals the row count).
- Every existing file has a 64-hex-character hash.

---

## Phase 2: Revision and Freshness

### Entry Criteria
- Phase 1 gate passed.
- `config_baseline` is known.

### Actions
1. Open each evidence file and find the software build id and hardware revision it records (fault injection results carry `build_id`; stop chain records carry `hardware_revision`). If the file records none, `revision_match = unknown` and verdict cannot be `supported`.
2. Compare with `config_baseline`. Mismatch: verdict `stale`.
3. Freshness: find the last change to the code the evidence tests: `git log -1 --format=%cI -- <path of the tested component>`. If that date is after the evidence `date`, verdict `stale`.
4. Wiring changes count too: if the stop chain drawing or harness revision changed after the stop chain test record, verdict `stale`.

### Output
Revision and freshness columns filled.

### Quality Gate
- Every row has `revision_match` in {true, false, unknown} and `fresh` in {true, false}.
- Every `fresh = false` row shows the git date and the evidence date in `notes`.

---

## Phase 3: Does the Result Support the Goal

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Read the result fields, not the summary. For JSON evidence: `jq '[.[]|select(.pass==false)]|length' <file>`; for a test record: the `failures` list.
2. Any failure in evidence cited as support: verdict `contradicts`. Partial runs (rows skipped) are `contradicts` unless the goal text is limited to the rows that ran.
3. Check scope: evidence for SG-02 must cover SG-02 mechanisms. A watchdog test cited for a stop chain goal does not support it.
4. Set `verdict = supported` only when the file exists, revision matches, it is fresh, it has no failures, and its scope matches the goal.
5. Emit `evidence_audit` as JSON and list every non-supported row with the action needed (rerun test, update case, fix defect).

### Output
`evidence_audit`.

### Quality Gate
- `jq '[.[]|select(.verdict=="supported" and (.exists!=true or .revision_match!=true or .fresh!=true))]|length' evidence_audit.json` prints 0.
- Every non-supported row has a next action in `notes`.

---

## Worked Example

Illustrative only.

```
$ grep -cE "^Sn[0-9]+:" safety_case.yaml
6
$ sha256sum evidence/EV-021_fi_results.json
9c1e...a77f  evidence/EV-021_fi_results.json
$ jq '[.[]|select(.pass==false)]|length' evidence/EV-021_fi_results.json
1
$ git log -1 --format=%cI -- steer_mcu/src
2026-10-02T14:11:09-05:00
```
`Sn2` cites EV-021 dated 2026-09-28 with one failed row, and the steering firmware changed on 2026-10-02: verdict `contradicts` (and also stale). Action: fix FI-015 detection, rebuild, rerun the campaign.

---

## Exit Criteria

DONE when every GSN solution has an audit row with hash, revision match, freshness, result check and a verdict, and every non-supported row has a next action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Evidence id not in the index | **Adjust**: verdict `missing`; ask the owner for the file. |
| Phase 2 | No `config_baseline` | **Stop**: an audit without a baseline cannot judge revisions. |
| Phase 2 | Evidence records no revision | **Adjust**: `revision_match = unknown`; request a rerun that records it. |
| Phase 3 | Owner asks to accept failed evidence | **Return**: the case must change, not the verdict. |

**Do not:** mark evidence supported because its file name sounds right, skip hashing, or edit evidence files during the audit.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
