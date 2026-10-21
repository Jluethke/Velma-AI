# Python Golden Output Tests with syrupy

**One-line description:** Pins the replay outputs of selected recordings as reviewed golden snapshots with the pytest plugin syrupy, with explicit rules for when `--snapshot-update` may be run, how to review the `.ambr` diff, and how CI fails on unused or changed snapshots.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `replay_harness` (object, required): Output of `detd-replay-harness-bitexact` (Python harness).
- `recording_path` (string, required): Recordings to pin.

---

## Outputs

- `golden_tests` (string[]): Test node ids and the snapshot files they own.

---

## Phase 1: Write Snapshot Tests

### Entry Criteria
- `pip show syrupy` prints a version (install with `pip install syrupy` into the dev requirements).
- The harness can return the canonical output for a recording as a Python object or string.

### Actions
1. Create `tests/test_golden_replay.py`. Parametrize over recordings with `@pytest.mark.parametrize("rec", RECORDINGS, ids=lambda p: p.stem)`.
2. Each test: `out = harness.replay(rec)`, then `assert out.canonical_text == snapshot`. The `snapshot` fixture comes from syrupy.
3. Snapshot the canonical text form (floats as `float.hex()`), not Python float objects, so the snapshot file holds exact values.
4. Also assert `hashlib.sha256(out.canonical_bytes).hexdigest() == snapshot(name="sha256")` for a compact check.

### Output
Test file.

### Quality Gate
- `pytest --collect-only -q tests/test_golden_replay.py` lists one test per recording.

---

## Phase 2: Create and Review Snapshots

### Entry Criteria
- Tests collect.

### Actions
1. First creation: `pytest tests/test_golden_replay.py --snapshot-update`. syrupy writes `tests/__snapshots__/test_golden_replay.ambr`.
2. Review: open the `.ambr` file and confirm each output matches what the recording's outputs were in the field, or the corrected expectation from the corpus label. Record reviewer and date in the commit message.
3. Rules for `--snapshot-update` later:

| Situation | Allowed |
|---|---|
| New recording added, reviewed | Yes |
| Intended spec change, linked change request, `git diff` of `.ambr` reviewed line by line | Yes |
| A test is red and the reason is unknown | No: run `detd-first-divergence-bisect` |
| CI is red and a release is pending | No |

4. Commit the `.ambr` file with the tests.

### Output
Reviewed snapshot file.

### Quality Gate
- `pytest tests/test_golden_replay.py` (without update) passes.
- `git diff --stat` for the commit shows the `.ambr` file and test file only.

---

## Phase 3: CI Behavior

### Entry Criteria
- Snapshots committed.

### Actions
1. CI runs `pytest tests/test_golden_replay.py` without `--snapshot-update`. By default syrupy fails the session when snapshots are unused; do not add `--snapshot-warn-unused` in CI, because it turns that failure into a warning.
2. Mutation check: change one character of one snapshot value locally, run the test, confirm failure with a diff shown, then `git restore` the file.

### Output
`golden_tests`.

### Quality Gate
- The mutation run fails and prints the snapshot diff; `git status --porcelain` is empty afterward.

---

## Worked Example

Illustrative only. `pytest tests/test_golden_replay.py --snapshot-update` prints `3 snapshots generated.` Later, a change to `margin_for` makes `test_golden[drive_017]` fail with a diff showing `speed_cap: '0x1.4p+3'` to `'0x1.2p+3'`. Not an intended change, so the update is refused and the bisect flow runs.

---

## Exit Criteria

DONE when every pinned recording has a reviewed snapshot, CI runs without update, and the mutation check fails as expected.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Output contains floats as objects | **Adjust**: snapshot the canonical text, not the object. |
| Phase 2 | Reviewer cannot confirm expected values | **Return**: leave the recording unpinned and record the open question. |
| Phase 3 | Someone ran update to get green | **Stop**: revert the `.ambr` change and investigate the divergence. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
