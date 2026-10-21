# Minimize a Failing Recording with Delta Debugging

**One-line description:** Shrinks a long recording that diverges or fails into a minimal reproducer by starting from the nearest state snapshot before the failure and applying Zeller's ddmin to the messages in the remaining ticks, keeping only reductions that preserve the same failure signature.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `regression_corpus` (string, required): Corpus containing the failing entry.
- `replay_harness` (object, required): Harness with snapshot restore support.

---

## Outputs

- `minimized_cases` (object[]): Per minimized entry: original id, snapshot tick used, ticks kept, messages kept, the failure signature, and the path of the minimized recording.

---

## Phase 1: Define the Failure Signature

### Entry Criteria
- At least one corpus entry fails the harness. If none, **Return** an empty list.

### Actions
1. Run the harness on the entry and record the signature: first diverging tick relative to the end of the kept range, field path, and direction of the change (for example `outputs.mode recorded=hold replayed=go`).
2. The interestingness test is: "harness reports a divergence on the same field path with the same recorded and replayed values". A different failure does not count as the same bug.
3. Write that test as a script returning 0 when interesting, 1 otherwise.

### Output
Signature and test script.

### Quality Gate
- The script returns 0 on the original entry, three runs in a row.

---

## Phase 2: Cut the Prefix with a Snapshot

### Entry Criteria
- Signature defined; snapshots supported (`detd-state-snapshot-restore`).

### Actions
1. Replay to each candidate tick before the failure, snapshot, and test whether starting from the snapshot still produces the signature.
2. Use binary search over the snapshot tick: latest tick that still reproduces.
3. Write the minimized recording as snapshot plus the remaining ticks; re-hash the chain.

### Output
Prefix-cut recording.

### Quality Gate
- The interestingness script returns 0 on the prefix-cut recording.

---

## Phase 3: ddmin Over Messages

### Entry Criteria
- Prefix-cut recording reproduces.

### Actions
1. Treat the list of (tick, message) items after the snapshot as the input set. Apply ddmin: split into n chunks (start n = 2); test each chunk alone and each complement; keep the first interesting reduction and restart with n = max(n - 1, 2); if none is interesting, double n up to the item count; stop when n equals the item count and no single removal is interesting.
2. Never remove a tick's `now_ns` or reorder items; only remove messages. Removing all messages of a tick keeps the empty tick so time still advances.
3. Each candidate must pass the chain check after re-hashing; that is a recording, not a test of the harness.
4. Store the minimized recording in the corpus with manifest `selection_reason: minimized from <id>` and the same label.

### Output
`minimized_cases`.

### Quality Gate
- The final recording is 1-minimal: removing any single remaining message makes the script return 1 (run that check and save the log).
- The script returns 0 on the final recording.

---

## Worked Example

Illustrative only. Entry `drive_211`: 9000 ticks, 81000 messages, signature `outputs.mode hold to go at tick 8712`. Phase 2: latest reproducing snapshot at tick 8690. Phase 3: ddmin from 214 messages to 3 (two radar tracks and one speed frame). 1-minimal check: each of 3 removals returns 1.

---

## Exit Criteria

DONE when each failing entry has a 1-minimal reproducer with the same signature, stored in the corpus with a manifest entry.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Failure is intermittent | **Stop**: remaining nondeterminism; run `detd-double-run-check` before minimizing. |
| Phase 2 | No snapshot reproduces | **Adjust**: keep the full prefix and minimize only messages. |
| Phase 3 | Reduction changes the signature | **Adjust**: reject that candidate; the signature check is the gate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
