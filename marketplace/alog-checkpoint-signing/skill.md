# Signed Checkpoint of the Log Head

**One-line description:** Define a periodic signed checkpoint that commits to the current chain head or tree head, sequence, size, and time, so a verifier has a signed high-water mark that resists tail truncation and whole-file replay.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chain_link_spec` (object, required): The linkage rules, so the checkpoint names the exact head it commits to.
- `signing_keypair` (object, required): The Ed25519 key and key_id used to sign each checkpoint.
- `checkpoint_interval` (string, optional): How often checkpoints are issued (by record count or time), from the operator; left open when absent.

---

## Outputs

- `checkpoint_spec` (object): The checkpoint fields, the signing input, the issue cadence, and the verifier rule that uses the latest checkpoint as a high-water mark.

---

## Phase 1: Define the checkpoint content

### Entry Criteria
- `chain_link_spec` defines the head.
- `signing_keypair` provides the key_id.

### Actions
1. Define the checkpoint fields: the latest `content_hash` (chain head) or Merkle tree head, the latest `seq` and the tree size, an RFC 3339 UTC `timestamp`, and the `key_id`.
2. State the signed input: the canonical serialization of the checkpoint fields, signed with the Ed25519 key, exactly as the sign and verify flow signs record bytes.
3. State why this resists truncation: the signed checkpoint commits to a `seq` and size, so a verifier that holds a later checkpoint rejects a log whose tail is shorter than that committed high-water mark.
4. State that a checkpoint is append-only like records: checkpoints are stored in sequence and never overwritten, so the history of heads is itself preserved.

### Output
A checkpoint record definition with its signed input.

### Quality Gate
- The checkpoint names the head, the `seq`, the size, the `timestamp`, and the `key_id`.
- The signed input is the canonical bytes of those fields.
- Checkpoints are append-only and never overwritten.

---

## Phase 2: Issue cadence and verifier rule

### Entry Criteria
- The checkpoint content is defined.

### Actions
1. Set the issue cadence from `checkpoint_interval` (for example every N records or every T minutes) if given, otherwise record it as an open question; also issue a checkpoint at each key rotation and before each external anchor.
2. Define the verifier rule: on verification, check every checkpoint signature, confirm each checkpoint's head and `seq` match the recomputed chain at that point, and confirm checkpoints never move backward in `seq` or size.
3. State the truncation detection: if the newest record `seq` is below the `seq` in the most recent trusted checkpoint, the log was truncated; report the exact expected and found `seq`.
4. Record `checkpoint_spec` with the fields, the signing input, the cadence, and the verifier rule.

### Output
`checkpoint_spec` with the cadence and the verifier high-water-mark rule.

### Quality Gate
- A cadence is cited from `checkpoint_interval` or marked open, plus rotation and pre-anchor triggers.
- The verifier checks every checkpoint signature and that `seq` and size never decrease.
- Truncation below the latest trusted checkpoint `seq` is reported with expected and found values.

---

## Worked Example

Input (illustrative): interval every 1000 records; key_id 2026-ed25519-a.

```json
{"head": "7c91...", "seq": 4000, "tree_size": 4001, "timestamp": "2026-10-21T16:00:00Z",
 "key_id": "2026-ed25519-a", "sig": "..."}
```

Verifier holding seq=4000 checkpoint rejects a log whose tail ends at seq=3990 (truncated).

---

## Exit Criteria

DONE when `checkpoint_spec` defines a signed checkpoint over the head, seq, size, time, and key_id, sets a cadence or defers it, and gives a verifier rule that uses the latest checkpoint as a non-decreasing high-water mark.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Checkpoint signs a non-canonical string | **Adjust**: sign the canonical bytes so the verifier checks identical input, as in the sign and verify flow. |
| Phase 2 | Checkpoints are overwritten in place | **Stop**: keep checkpoints append-only; overwriting loses the head history that detects rewrites. |
| Phase 2 | No cadence provided | **Return**: record the cadence as an open question; do not invent an interval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
