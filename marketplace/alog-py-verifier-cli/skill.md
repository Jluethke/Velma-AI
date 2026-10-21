# Python Verifier CLI

**One-line description:** Build a Python command-line verifier that implements the verifier specification exactly, reusing the canonical-hash and signature modules, and returns the pinned exit statuses with the specified report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `verifier_spec` (object, required): The ordered checklist, exit-status table, and report format the CLI must match.
- `py_canonical_hasher` (object, required): The canonical-hash module reused to recompute content hashes.
- `py_signer` (object, required): The sign and verify module reused to check checkpoint signatures.
- `repo_path` (string, required): Path to the repository where the verifier CLI and its tests are written.

---

## Outputs

- `py_verifier` (object): The Python verifier CLI path, the invocation, and the result of running it on a known-good and a known-bad log.

---

## Phase 1: Implement the checklist as a CLI

### Entry Criteria
- `verifier_spec` defines the checks and exit codes.
- `py_canonical_hasher` and `py_signer` are importable.

### Actions
1. Create the CLI entry point with `argparse` and expose it as a console script; run it with `python -m audit.verify` or an installed entry point. Add the public keys path as an argument.
2. Implement each check from `verifier_spec` in the listed order, reusing `py_canonical_hasher` to recompute `content_hash` and `py_signer` to verify checkpoint signatures; do NOT reimplement canonicalization or signatures, so the verifier and writer agree byte for byte.
3. Accept the inputs from `verifier_spec`: the log path or segment directory, the public keys by `key_id`, and optional anchored checkpoints.
4. Return the exact exit statuses from `verifier_spec` and print the specified machine-readable and human-readable report; walk forward from genesis and report the first failure position.

### Output
A CLI that runs the verifier checklist and returns the pinned statuses.

### Quality Gate
- Each check from `verifier_spec` is implemented in order.
- Canonicalization and signature checks reuse `py_canonical_hasher` and `py_signer`, not new code.
- The CLI returns the pinned exit statuses and the specified report.

---

## Phase 2: Run on known-good and known-bad logs

### Entry Criteria
- The CLI builds or runs.

### Actions
1. Run the CLI on a known-good log and assert exit status 0 and a report showing all records checked with no failure.
2. Run it on a log with one edited record and assert the hash-or-link exit code and a report naming the first bad `seq`; run it on a log with a bad checkpoint signature and assert the signature exit code.
3. Confirm the verifier never modifies the input: compare the log file hash before and after a run and assert it is unchanged. Do NOT let the verifier rewrite or normalize the log.
4. Record the CLI path, the invocation, and the status for each case in `py_verifier`.

### Output
`py_verifier` with exit statuses recorded for good and bad logs and an unchanged-input check.

### Quality Gate
- The known-good log returns exit status 0.
- An edited record and a bad checkpoint each return their pinned nonzero code.
- The input log hash is identical before and after the run.

---

## Worked Example

Input (illustrative): `repo_path` = ./audit, specs from the design flows.

Phase 2 run (illustrative):

```
python -m audit.verify --log good.log --keys /etc/audit/keys
good.log  -> exit 0  {records: 4001, first_failure: null}
edited.log -> exit 2  {first_failure: seq 1337, field content_hash}
badsig.log -> exit 3  {first_failure: checkpoint seq 4000}
input hash unchanged after run: OK
```

`py_verifier` records the invocation and each exit status.

---

## Exit Criteria

DONE when the Python CLI implements the `verifier_spec` checklist in order, reuses `py_canonical_hasher` and `py_signer`, returns the pinned exit statuses on good and bad logs, and leaves the input log byte-for-byte unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The CLI reimplements canonicalization | **Stop**: reuse `py_canonical_hasher`; a second canonicalizer can disagree and cause false tamper reports. |
| Phase 2 | Known-good log returns a nonzero status | **Retry**: the verifier disagrees with the writer; diff the recomputed bytes against the stored record before changing the test. |
| Phase 2 | Input hash changes after a run | **Stop**: the verifier is writing to the log; make all file access read-only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
