# Signing Key Storage and Rotation

**One-line description:** Define where the Ed25519 private key is stored and access-controlled, and how keys rotate with a key_id, an overlap window, and retained public keys so old records stay verifiable.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `signing_keypair` (object, required): The active keypair and its key_id, to be stored and later rotated.
- `threat_model` (object, required): Adversary capabilities, used to set how strongly the private key must be protected.
- `rotation_interval` (string, optional): How often keys rotate, supplied by the operator or a cited policy; left as an open question when absent.

---

## Outputs

- `key_management_plan` (object): The storage location and access rule, the rotation procedure with key_id handling, the overlap window, and the public-key retention rule.

---

## Phase 1: Storage and access control

### Entry Criteria
- `signing_keypair` and `threat_model` are present.

### Actions
1. Choose the storage tier from `threat_model`: a file with owner-only permissions on a locked-down host for a low-capability adversary, or a hardware security module or cloud key service that signs without exporting the key when an operator could read disk.
2. State the access rule: which single service account may use the key, and that no human copies the private key to a laptop or a shared drive.
3. State that backups of the log must not include the private key, and that the private key is never written into the records or checkpoints it signs.
4. Record how a compromise is detected and what the response is: revoke the `key_id`, stop signing, and anchor a final checkpoint under the old key before switching.

### Output
A storage tier and access rule tied to the adversary in `threat_model`.

### Quality Gate
- The storage tier is justified by a capability in `threat_model`.
- Exactly one account or service is authorized to use the key.
- Backups and records are stated to exclude the private key.

---

## Phase 2: Rotation with key_id and overlap

### Entry Criteria
- A storage and access rule exists.

### Actions
1. Define rotation: generate a new keypair with a new `key_id`, begin signing new records and checkpoints with it, and stop using the old key, while keeping the old public key available for verifying historical records.
2. Define the overlap window: during rotation a verifier must accept signatures under either the outgoing or incoming `key_id`; state how long and how the window closes.
3. State that every record and checkpoint already carries its `key_id`, so a verifier picks the correct public key per record and no re-signing of old records is needed or allowed.
4. Set the rotation cadence from `rotation_interval` if given, otherwise record it as an open question; also rotate immediately on suspected compromise. Pin a final checkpoint and external anchor at each rotation so the boundary is fixed.

### Output
`key_management_plan` with the rotation steps, overlap window, and public-key retention.

### Quality Gate
- Rotation issues a new `key_id` and retains old public keys for historical verification.
- An overlap window is defined during which both key_ids verify.
- A cadence is cited from `rotation_interval` or marked as an open question, never invented.

---

## Worked Example

Input (illustrative): `threat_model` says a root operator can read disk; `rotation_interval` absent.

Phase 1 selects a key service that signs without exporting the key (operator cannot read it).

Phase 2 produces `key_management_plan` (illustrative):

```
rotate: new key_id 2027-ed25519-b; sign new records with it; keep 2026-ed25519-a public key
overlap: verifiers accept a and b for 30 days after cutover (operator-confirmed window)
cadence: OPEN (operator to set); always rotate on compromise
boundary: sign and anchor a final checkpoint under the old key_id at cutover
```

---

## Exit Criteria

DONE when `key_management_plan` ties storage to the adversary, authorizes one signer, defines rotation with a new key_id and an overlap window, retains old public keys, and cites or defers the cadence without inventing it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Private key would sit on an operator-readable disk | **Adjust**: move to a key service or module that signs without exporting, per the operator-readable capability in `threat_model`. |
| Phase 2 | Plan proposes re-signing old records with the new key | **Stop**: re-signing history destroys the original evidence; keep old public keys and verify per-record key_id instead. |
| Phase 2 | No rotation cadence is provided | **Return**: record the cadence as an open question; do not invent an interval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
