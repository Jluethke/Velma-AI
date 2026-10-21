# External Anchoring of Checkpoints

**One-line description:** Publish each signed checkpoint head to an independent external witness so an actor who holds the signing key still cannot rewrite history without contradicting a record held outside their control.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `checkpoint_spec` (object, required): The signed checkpoint whose head is published to an external witness.
- `anchoring_target` (string, required): The external witness to anchor to (for example an RFC 3161 timestamp authority URL, a transparency log, or a second organization's store), named by the operator.

---

## Outputs

- `anchoring_procedure` (object): The steps to anchor a checkpoint head externally, the proof stored locally, and the verifier rule that compares anchored heads to the log.

---

## Phase 1: Anchor the checkpoint head

### Entry Criteria
- `checkpoint_spec` defines the signed head.
- `anchoring_target` names one external witness.

### Actions
1. State why anchoring is needed: signing stops an outsider, but an actor who holds the key can sign a rewritten history; an external witness records the head at a point in time outside that actor's control.
2. Anchor the checkpoint head to `anchoring_target`. For an RFC 3161 timestamp authority: create a request over the checkpoint head with `openssl ts -query -data checkpoint_head.bin -sha256 -out req.tsq`, send it to the authority, and store the returned token. Confirm the exact flags against `openssl ts -help` or the authority's docs.
3. For a transparency log or a second organization as the witness, submit the head and store the witness's signed receipt or inclusion proof; do not treat an unsigned acknowledgment as an anchor.
4. Store the anchor proof (timestamp token or receipt) next to the checkpoint it covers, named by the checkpoint `seq`, so a verifier can find it.

### Output
An external anchor proof stored locally for the checkpoint head.

### Quality Gate
- The anchor covers the exact checkpoint head bytes, not a summary.
- The stored proof is signed by the external witness, not an unsigned acknowledgment.
- The proof is stored and named so a verifier can locate it by checkpoint `seq`.

---

## Phase 2: Verify against anchors

### Entry Criteria
- At least one anchor proof is stored.

### Actions
1. Define the verifier rule: for each anchored checkpoint, confirm the external proof is valid (the timestamp token verifies against the authority certificate, or the witness receipt verifies), and confirm the anchored head equals the head the log produces at that `seq` and size.
2. Combine with the consistency proof: when a newer head is published, require a consistency proof from the last anchored head to the new head, so a key holder cannot replace the anchored prefix.
3. State the cadence: anchor at least at each checkpoint interval or at a cadence the operator sets; record it as an open question if unset, and anchor before retiring a key.
4. Record `anchoring_procedure` with the anchor steps, the stored-proof location, and the verifier rule.

### Output
`anchoring_procedure` with the verify rule linking anchors, heads, and consistency proofs.

### Quality Gate
- The verifier validates the external proof and matches the anchored head to the log.
- A consistency proof is required from the last anchored head to any newer head.
- The anchoring cadence is cited or marked open, never invented.

---

## Worked Example

Input (illustrative): `anchoring_target` = an RFC 3161 timestamp authority.

```
openssl ts -query -data checkpoint_4000.head -sha256 -out ts_4000.tsq
# POST ts_4000.tsq to the authority, save ts_4000.tsr
openssl ts -verify -in ts_4000.tsr -data checkpoint_4000.head -CAfile tsa_ca.pem
```

`anchoring_procedure` stores ts_4000.tsr by seq and records the verify command and consistency-proof rule.

---

## Exit Criteria

DONE when `anchoring_procedure` anchors each checkpoint head to an independent witness, stores a signed proof by checkpoint seq, and the verifier validates the proof, matches the head, and requires a consistency proof forward.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Witness returns only an unsigned acknowledgment | **Stop**: an unsigned ack is not an anchor; use a signed timestamp token or witness receipt. |
| Phase 2 | New head published without a consistency proof | **Adjust**: require a consistency proof from the last anchored head, or a key holder can rewrite the anchored prefix. |
| Phase 2 | Anchor cadence unset | **Return**: record it as an open question for the operator; do not invent a cadence. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
