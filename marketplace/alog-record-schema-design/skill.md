# Append-Only Record Schema Design

**One-line description:** Design the append-only log record so the signed and hashed payload is separated from the integrity fields, with sequence number, timestamp, prev_hash, and content_hash placed without circular hashing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_requirements` (object, required): Integrity requirements that tell which fields must be covered by the content hash.
- `hash_algorithm_spec` (object, required): Chosen hash function, digest length, and encoding, so hash fields are fixed width.
- `event_fields` (string, required): The business fields each event carries (for example actor, action, target, outcome), as a list the caller supplies.

---

## Outputs

- `record_schema` (object): Field list split into the hashed payload and the integrity envelope, with types, required or optional, and the exact set of bytes the content hash covers.

---

## Phase 1: Define the record envelope

### Entry Criteria
- `event_fields` lists the business fields to record.
- `hash_algorithm_spec` gives the digest length and encoding.

### Actions
1. Place the business fields from `event_fields` inside a single `payload` object so the hashed unit is one nested value, not scattered top-level keys.
2. Add the envelope fields outside `payload`: `seq` (unsigned integer, strictly increasing by 1 from the genesis value), `timestamp` (RFC 3339 UTC string), `prev_hash` (digest, fixed width per `hash_algorithm_spec`), and `content_hash` (same width).
3. Add a `key_id` string field so a verifier knows which public key signed a later checkpoint, and a `schema_version` integer so the record format can change without breaking old verification.
4. Mark every field required except those `log_requirements` explicitly allows to be absent, and give each field one concrete type.

### Output
A field table listing every envelope and payload field with type and required flag.

### Quality Gate
- Business fields live under a single `payload` object.
- `seq`, `timestamp`, `prev_hash`, `content_hash`, `key_id`, and `schema_version` all exist with one concrete type each.
- Each field is marked required or optional, and every optional field cites `log_requirements`.

---

## Phase 2: Pin what the content hash covers

### Entry Criteria
- The field table from Phase 1 exists.

### Actions
1. State that `content_hash` covers the canonical serialization of everything except `content_hash` itself, so the hash is never computed over its own value. Include `payload`, `seq`, `timestamp`, `prev_hash`, `key_id`, and `schema_version` in the hashed set.
2. State that `prev_hash` is inside the hashed set, which is what binds each record to its predecessor; a verifier recomputes `content_hash` over these exact fields.
3. Define the genesis record: `seq` at the documented start value (for example 0), and `prev_hash` set to a fixed all-zero digest of the correct width, documented as the genesis sentinel.
4. Record the field ordering is irrelevant to storage but fixed for hashing by the canonical serialization flow, so note that `content_hash` is computed only after canonicalization.

### Output
`record_schema` with the hashed field set, the genesis definition, and the exclusion of `content_hash` from its own input.

### Quality Gate
- `content_hash` is excluded from the set of bytes it covers.
- `prev_hash` is inside the hashed set so records are chained.
- The genesis record defines a fixed-width all-zero `prev_hash` sentinel and a documented start `seq`.

---

## Worked Example

Input (illustrative): `event_fields` = "actor, action, target, outcome, request_id".

Phase 1 and 2 produce `record_schema` (illustrative record instance):

```json
{
  "schema_version": 1, "seq": 42, "timestamp": "2026-10-21T15:04:05Z",
  "key_id": "2026-ed25519-a",
  "prev_hash": "9f2c...<64 hex>",
  "payload": {"actor": "svc-billing", "action": "refund", "target": "inv_1001", "outcome": "ok", "request_id": "r-77"},
  "content_hash": "3ab8...<64 hex>"
}
```
The content hash covers every field above except `content_hash`.

---

## Exit Criteria

DONE when `record_schema` lists every field with a type, keeps business data under `payload`, names the exact hashed field set excluding `content_hash`, and defines a genesis record with a fixed sentinel `prev_hash`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `event_fields` names a field with no clear type | **Return**: ask the caller for the concrete type; do not default an untyped field into the hashed payload. |
| Phase 2 | Design hashes the record including `content_hash` | **Stop**: a self-referential hash can never verify; exclude `content_hash` from its own input and redo the hashed set. |
| Phase 2 | Genesis `prev_hash` width is unclear | **Adjust**: set it to an all-zero digest of the width in `hash_algorithm_spec` and document it as the sentinel. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
