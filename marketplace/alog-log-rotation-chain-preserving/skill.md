# Chain-Preserving Log Rotation

**One-line description:** Rotate log files into segments without breaking the chain by carrying the previous segment's final head and signed checkpoint into the next segment header, so verification spans segment boundaries.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chain_link_spec` (object, required): The linkage rules the rotation must preserve across a segment boundary.
- `checkpoint_spec` (object, required): The checkpoint definition used to seal a segment at rotation.
- `rotation_trigger` (string, required): When to rotate (by size, record count, or time), set by the operator.

---

## Outputs

- `rotation_procedure` (object): The steps to seal a segment, start the next with a header that links to the previous head, and verify continuity across segments.

---

## Phase 1: Seal the current segment

### Entry Criteria
- `chain_link_spec` and `checkpoint_spec` are present.
- `rotation_trigger` defines the rotation condition.

### Actions
1. On the `rotation_trigger` condition (for example file reaches a size or a record count the operator set), stop appending to the current segment.
2. Write and sign a closing checkpoint for the segment per `checkpoint_spec`, committing to the segment's final `content_hash`, final `seq`, size, and `key_id`.
3. Fsync the segment and its closing checkpoint, then make the segment read-only (for example remove write permission) so no later append lands in a sealed segment.
4. Record the segment's final head and `seq` to carry into the next segment; do NOT reset `seq` at rotation, because a global monotonic `seq` keeps gap detection working across segments.

### Output
A sealed, read-only segment with a signed closing checkpoint.

### Quality Gate
- A closing checkpoint commits to the segment's final head and `seq`.
- The sealed segment is read-only and fsynced.
- `seq` continues across the boundary and is not reset.

---

## Phase 2: Start the next segment and verify continuity

### Entry Criteria
- The previous segment is sealed.

### Actions
1. Start the next segment with a header that records the previous segment's final `content_hash` and closing checkpoint reference, so the first record of the new segment sets its `prev_hash` to that final head.
2. Set the first new record's `prev_hash` to the previous segment's final `content_hash` and its `seq` to previous plus 1, exactly as within a segment, so the chain is unbroken at the boundary.
3. Define the verifier rule: order segments by their starting `seq`, verify each segment's chain and closing checkpoint, and confirm each segment header's previous head equals the prior segment's final `content_hash`; a mismatch means a segment was dropped, reordered, or altered.
4. Write a test that rotates mid-chain, then runs the verifier across both segments and asserts continuity; also delete a whole segment and assert the verifier reports the gap. Run it and read the output.

### Output
`rotation_procedure` with the boundary linkage and a passing cross-segment verification test.

### Quality Gate
- The new segment header links to the previous segment's final head.
- The first new record's `prev_hash` and `seq` continue the chain across the boundary.
- The verifier spans segments and a deleted segment is reported on an executed run.

---

## Worked Example

Input (illustrative): `rotation_trigger` = 1 GB per segment.

```
seg-000: last seq=99999, head=ab12..., closing checkpoint signed, chmod a-w
seg-001 header: prev_segment_head=ab12..., ref closing checkpoint of seg-000
seg-001 first record: seq=100000, prev_hash=ab12...
verify spans seg-000 then seg-001: OK; delete seg-000 -> gap at seq 0..99999 reported
```

---

## Exit Criteria

DONE when `rotation_procedure` seals each segment with a signed closing checkpoint and read-only bytes, links the next segment header and first record to the previous final head, keeps `seq` global, and verifies across segments.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `seq` resets to zero in the new segment | **Stop**: keep a global `seq`; a reset hides deletions across the boundary. |
| Phase 2 | New segment does not reference the old head | **Adjust**: put the previous final head in the segment header and in the first record's `prev_hash`. |
| Phase 2 | Verifier checks segments independently | **Retry**: order and link segments; a per-segment-only check misses a dropped or reordered segment. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
