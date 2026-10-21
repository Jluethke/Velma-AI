# Canonical Serialization with RFC 8785 (JCS)

**One-line description:** Define the one canonical byte string a record serializes to before hashing, using the RFC 8785 JSON Canonicalization Scheme, and pin the number, string, and key-ordering rules that make two independent encoders agree.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `record_schema` (object, required): The record field set whose hashed subset must serialize to one deterministic byte string.

---

## Outputs

- `canonicalization_spec` (object): The canonical form rules: key ordering, string escaping, number format, UTF-8 output, and the fields excluded from the canonical bytes.

---

## Phase 1: Choose the canonical form and say why it matters

### Entry Criteria
- `record_schema` names the hashed field set.

### Actions
1. State the problem in one line: two encoders of the same data can emit different bytes (reordered keys, extra whitespace, 1 versus 1.0, different unicode escaping), so hashing the raw serialized output is not reproducible and a verifier would see a false tamper.
2. Select RFC 8785 JSON Canonicalization Scheme as the canonical form because it defines key sorting, whitespace, string escaping, and number formatting so one input maps to one byte string.
3. Record the JCS rules that will be enforced: object keys sorted by their UTF-16 code unit order, no insignificant whitespace, strings escaped per the RFC, and numbers formatted per ECMAScript Number-to-String (which is why floats are risky).
4. State that the canonical output is UTF-8 bytes, and the hash is computed over those bytes, never over a language object or a pretty-printed string.

### Output
A statement of the canonical form (JCS) and the specific rules it enforces.

### Quality Gate
- The spec names RFC 8785 JCS as the canonical form, not an ad hoc sort.
- The four failure sources (key order, whitespace, number format, unicode escaping) are each named with the JCS rule that removes them.
- The hash input is stated to be the UTF-8 bytes of the canonical string.

---

## Phase 2: Pin numbers, exclusions, and the hashed byte string

### Entry Criteria
- The canonical form is chosen.

### Actions
1. Forbid floating-point numbers in the hashed payload: require integers, or strings for decimal amounts, because JCS number formatting of non-integer floats can differ across platforms. Record this as a hard rule in `canonicalization_spec`.
2. List the fields excluded from the canonical bytes: `content_hash` is excluded (it is the output), and any purely local storage metadata is excluded; everything else in the hashed set from `record_schema` is included.
3. State the exact pipeline: take the record object, remove excluded fields, canonicalize with JCS, encode to UTF-8 bytes, then hash. Number the steps so a weaker model performs them in order.
4. Add two cross-encoder test vectors to the spec: one record with non-ASCII text and one with large integers, each with its expected canonical byte length, so any implementation can be checked against the same vectors.

### Output
`canonicalization_spec` with the number rule, the exclusion list, the ordered pipeline, and cross-encoder test vectors.

### Quality Gate
- Floats are forbidden in the hashed payload with a stated reason.
- `content_hash` is in the exclusion list.
- The spec gives at least two test vectors (non-ASCII and large integer) that any encoder must reproduce.

---

## Worked Example

Input (illustrative): `record_schema` payload has keys `outcome`, `action`, `actor`.

Phase 1 fixes JCS. Phase 2 produces the pipeline and a vector (illustrative):

```
record  -> drop content_hash -> JCS canonicalize -> UTF-8 -> SHA-256
JCS of {"b":1,"a":"caf\u00e9"} is the bytes:  {"a":"caf\u00e9","b":1}
keys sorted, no spaces, string escaped per RFC 8785
```

`canonicalization_spec` records: floats forbidden, `content_hash` excluded, and the two vectors with expected byte lengths.

---

## Exit Criteria

DONE when `canonicalization_spec` names RFC 8785 JCS, forbids floats in the hashed payload, excludes `content_hash`, gives the ordered canonicalize-then-hash pipeline, and includes cross-encoder test vectors.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Someone proposes hashing the raw serialized string | **Stop**: raw output is encoder dependent; require JCS canonicalization before hashing. |
| Phase 2 | A payload field is a non-integer float | **Adjust**: store it as an integer in minor units or as a string, and record the reason in the spec. |
| Phase 2 | No library implements JCS for the stack | **Return**: hand the stack-specific flow the JCS rules and its test vectors so it can select or verify a library. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
