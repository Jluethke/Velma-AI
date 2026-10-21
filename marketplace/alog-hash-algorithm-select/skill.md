# Hash Algorithm Selection for the Log Chain

**One-line description:** Pick the hash primitive and its output encoding for content hashes and chain links, ruling out broken and length-extension-prone functions with a decision table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_requirements` (object, required): Integrity requirements from the threat model flow, used to confirm collision and preimage resistance are needed.
- `platform_constraints` (string, optional): Runtime limits such as an embedded target, an available hardware hash unit, or a mandated algorithm, cited plainly.

---

## Outputs

- `hash_algorithm_spec` (object): The chosen hash function, its digest length, output encoding, and the domain-separation rule, with the functions that were ruled out and why.

---

## Phase 1: Rule out broken and risky functions

### Entry Criteria
- `log_requirements` is present and lists integrity as a goal.

### Actions
1. Apply the exclusion table: MD5 is excluded (practical collisions), SHA-1 is excluded (chosen-prefix collisions), CRC32 and non-cryptographic hashes are excluded (not collision resistant), and raw SHA-256 or SHA-512 over concatenated inputs without a length prefix is flagged for the length-extension note.
2. Confirm the default choice is SHA-256 from the SHA-2 family, which is collision and preimage resistant as of this writing and is available in every standard library named in the stack flows.
3. If `platform_constraints` mandates a specific function, record it and verify it is not in the exclusion table; if it is, record a conflict for the operator rather than accepting a broken function.
4. If a hardware hash unit is named in `platform_constraints`, confirm it computes SHA-256; otherwise keep the software path.

### Output
A shortlist with SHA-256 as the default and every excluded function annotated with its reason.

### Quality Gate
- MD5, SHA-1, and non-cryptographic hashes each appear in the exclusion table with a reason.
- The default is a function from a named, current standard library, not an invented or custom construction.
- Any mandated function from `platform_constraints` is checked against the exclusion table.

---

## Phase 2: Fix the primitive, encoding, and domain separation

### Entry Criteria
- A shortlist with a default exists.

### Actions
1. Set the digest: SHA-256 with a 32-byte (256-bit) output. Record the length so downstream fields are fixed width.
2. Set the on-record encoding to lowercase hex (64 characters) or base64url without padding, and pin exactly one so two writers never disagree; record the chosen one.
3. Write the domain-separation rule so content hashing, chain linking, and any tree hashing never feed the same byte layout to the hash: for tree nodes the Merkle flows prepend a 0x00 leaf prefix and 0x01 node prefix (RFC 6962); for the content hash the input is the canonical serialization only.
4. State that any concatenation of fields that are then hashed uses a fixed, documented order and fixed-width fields, so two different field sets cannot produce the same byte string.

### Output
`hash_algorithm_spec` with the function, 32-byte length, the single chosen encoding, and the domain-separation rule.

### Quality Gate
- `hash_algorithm_spec` names the function and the exact digest length in bytes.
- Exactly one output encoding is pinned (hex or base64url), not both.
- The domain-separation rule distinguishes content, chain, and tree hashing so no two share a byte layout.

---

## Worked Example

Input (illustrative): `log_requirements.signing_required` = true, `platform_constraints` empty.

Phase 1 excludes MD5 and SHA-1 and selects SHA-256 as the default.

Phase 2 produces `hash_algorithm_spec` (illustrative):

```json
{
  "function": "SHA-256", "digest_bytes": 32, "encoding": "hex-lower",
  "domain_separation": {"content": "H(canonical_bytes)", "leaf": "H(0x00 || record_hash)",
                          "node": "H(0x01 || left || right)"},
  "excluded": {"MD5": "collisions", "SHA-1": "chosen-prefix collisions", "CRC32": "not collision resistant"}
}
```
Verify the function name and digest length against the standard library docs for your stack before coding.

---

## Exit Criteria

DONE when `hash_algorithm_spec` names a current, standard hash function with a fixed digest length, a single pinned encoding, and a domain-separation rule, and every excluded function has a recorded reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `platform_constraints` mandates MD5 or SHA-1 | **Stop**: record the conflict and return to the operator; do not build a chain on an excluded function. |
| Phase 2 | Two writers may use different encodings | **Adjust**: pin exactly one encoding in `hash_algorithm_spec` and state it is mandatory for all writers and verifiers. |
| Phase 2 | Unsure whether a library exposes SHA-256 | **Retry**: check the library reference or run its hash help before pinning; do not assume an API name. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
