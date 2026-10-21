# Tamper-Evident Log Threat Model and Requirements

**One-line description:** Define the adversary, the tamper actions the log must make detectable, and the integrity requirements that every later flow must satisfy.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `system_context` (string, required): What the log records, who writes it, where it is stored, and who may have write or delete access to the storage.
- `compliance_drivers` (string, optional): Named standards or contractual rules that drive retention or evidence, cited by number only (for example a retention period in a policy).

---

## Outputs

- `threat_model` (object): Adversary capabilities, the list of tamper actions in scope, and the actions explicitly out of scope.
- `log_requirements` (object): Integrity requirements derived from the threat model: detection targets, signing need, anchoring need, and retention.

---

## Phase 1: Enumerate adversaries and tamper actions

### Entry Criteria
- `system_context` names the writer, the storage, and who can reach the storage.

### Actions
1. Write down each actor who can reach the log bytes at rest: the writing process, an operator with disk access, a database administrator, a backup system, and an outside attacker who gains the storage.
2. For each actor, mark whether they can read, append, overwrite in place, truncate, delete, or reorder records. Record this as a capability table.
3. List the tamper actions the log must detect: edit a past record, delete a record, insert a back-dated record, reorder records, truncate the tail, and replay a whole file from an earlier state.
4. Mark any action as out of scope only when `system_context` states it cannot happen (for example write-once media), and record why.
5. Decide from the capability table whether an append-only hash chain alone is enough, or whether a signature is needed because an actor can rewrite the whole file and recompute hashes.

### Output
`threat_model` with the actor capability table and the in-scope and out-of-scope tamper actions.

### Quality Gate
- Every actor in `system_context` appears in the capability table with read, append, overwrite, truncate, delete, and reorder marked.
- Each of the six tamper actions is marked in scope or out of scope, and every out-of-scope action cites a line of `system_context`.
- The signing decision is written with the specific actor capability that forces it, or a note that no actor can recompute hashes.

---

## Phase 2: Derive the integrity requirements

### Entry Criteria
- `threat_model` capability table is complete.

### Actions
1. For each in-scope tamper action, write the detection mechanism that catches it: content hash for edits, prev_hash linkage for reorder and insert, signed checkpoints for whole-file replay, external anchoring for an actor who can rewrite and re-sign.
2. Decide whether signing is required (set `log_requirements.signing_required` true when any actor can overwrite in place or delete) and whether external anchoring is required (true when any actor holds the signing key).
3. Record the retention period and the review cadence from `compliance_drivers` if present, otherwise mark them as an open question for the operator.
4. State the verification cost target as an open question for the operator rather than inventing a number: how long a full verification may take and how often it runs.

### Output
`log_requirements` mapping each in-scope tamper action to a detection mechanism, with signing and anchoring flags set.

### Quality Gate
- Every in-scope tamper action from `threat_model` maps to exactly one named detection mechanism.
- `signing_required` and `anchoring_required` are both set to true or false with the capability that decided each.
- Any numeric retention or cadence value is traced to `compliance_drivers` or is listed as an open question, never invented.

---

## Worked Example

Input (illustrative): `system_context` = "Service writes JSON audit events to /var/log/audit; the service account and a root operator can both edit or delete files; nightly backup copies the directory."

Phase 1 produces a capability table where the root operator has overwrite, truncate, and delete. Because the operator can overwrite in place and recompute a plain hash chain, the signing decision is "required".

Phase 2 produces `log_requirements`:

```json
{
  "detection": {"edit": "content_hash", "reorder": "prev_hash", "truncate": "signed_checkpoint",
                 "whole_file_replay": "external_anchor"},
  "signing_required": true,
  "anchoring_required": true,
  "retention": "OPEN: operator to confirm",
  "verify_cadence": "OPEN: operator to confirm"
}
```

---

## Exit Criteria

DONE when every in-scope tamper action maps to a detection mechanism, the signing and anchoring flags are set with the capability that forced each, and no retention or cadence number was invented.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `system_context` does not say who can reach storage | **Return**: ask the operator to list every account with disk, database, and backup access before modeling. |
| Phase 1 | An actor can replace the whole file and the key | **Adjust**: mark whole-file replay in scope and require external anchoring in Phase 2. |
| Phase 2 | A required retention number is unknown | **Stop**: record it as an open question; do not guess a retention period. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
