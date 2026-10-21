# Hash Chain Linkage Design

**One-line description:** Define how each record binds to its predecessor through prev_hash and content_hash, the genesis sentinel, the strictly increasing sequence rule, and the recompute rule a verifier follows.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `record_schema` (object, required): The record field set, including prev_hash, content_hash, and seq positions.
- `hash_algorithm_spec` (object, required): The hash function and digest width used to link records.

---

## Outputs

- `chain_link_spec` (object): The linkage rule: how prev_hash is set from the previous content_hash, the genesis record, the seq rule, and the verifier recompute steps.

---

## Phase 1: Define linkage and genesis

### Entry Criteria
- `record_schema` places `prev_hash`, `content_hash`, and `seq`.

### Actions
1. State the write rule: for every record after genesis, `prev_hash` equals the previous record's `content_hash`, byte for byte in the pinned encoding.
2. State the genesis rule: the first record has `seq` at the documented start value and `prev_hash` set to the all-zero sentinel digest of the width in `hash_algorithm_spec`.
3. State the sequence rule: `seq` increases by exactly 1 per record, with no gaps and no repeats, so a deleted record leaves a detectable gap.
4. State that `content_hash` is computed by the canonical-hash function over the record with `content_hash` excluded, so `prev_hash` is already inside the hashed bytes and cannot be swapped without changing `content_hash`.

### Output
A written linkage rule covering genesis, prev_hash assignment, and the seq step.

### Quality Gate
- `prev_hash` of record N is defined as the `content_hash` of record N-1.
- The genesis record has the sentinel `prev_hash` and the documented start `seq`.
- `seq` is defined to increase by exactly 1 with no gaps.

---

## Phase 2: Define the verifier recompute rule

### Entry Criteria
- The linkage rule from Phase 1 exists.

### Actions
1. Write the per-record verification steps a verifier runs: recompute `content_hash` from the record, compare to the stored `content_hash`, then compare `prev_hash` to the previous record's recomputed `content_hash`, then check `seq` is previous plus 1.
2. State that verification walks forward from genesis; a mismatch at record N localizes the first tampered or missing record to position N.
3. State what each failure means: a `content_hash` mismatch is an edited record, a `prev_hash` mismatch is a reorder or insert, and a `seq` gap is a deletion.
4. Record that the chain alone does not stop an actor who rewrites the whole file and recomputes every hash; note that the signing and anchoring flows cover that case.

### Output
`chain_link_spec` with the verifier recompute steps and the meaning of each failure.

### Quality Gate
- The recompute rule recomputes `content_hash` and compares both `content_hash` and `prev_hash`.
- Each failure type (edit, reorder or insert, deletion) maps to a check.
- The spec states the chain alone does not resist a full-file rewrite and points to signing and anchoring.

---

## Worked Example

Input (illustrative): digest width 32 bytes, hex encoding, start seq 0.

`chain_link_spec` (illustrative):

```
genesis: seq=0, prev_hash="00..00" (64 hex zeros)
record N: prev_hash == content_hash(N-1); seq == seq(N-1)+1
verify(N): h = SHA256(JCS(record without content_hash))
           assert h == record.content_hash          # else edited
           assert record.prev_hash == h_prev         # else reorder/insert
           assert record.seq == prev_seq + 1         # else deletion
```

---

## Exit Criteria

DONE when `chain_link_spec` defines genesis, the prev_hash-to-content_hash binding, the exact seq step, the forward recompute rule, and the failure meaning for each check, and names signing and anchoring for full rewrites.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Start `seq` value is not documented | **Adjust**: pick a documented constant (for example 0) and record it in the spec so every writer agrees. |
| Phase 2 | Verifier design walks backward from the tail | **Adjust**: walk forward from genesis so the first bad record is localized, not just the last. |
| Phase 2 | Design relies on the chain alone against a key holder | **Return**: a full rewrite defeats a plain chain; route to the signing and external anchoring flows. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
