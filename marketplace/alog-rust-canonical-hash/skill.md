# Rust Canonical Hash: JCS plus SHA-256

**One-line description:** Build a Rust function that canonicalizes a record with RFC 8785 and computes its SHA-256 content hash, then confirm it against the cross-encoder test vectors.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `canonicalization_spec` (object, required): The JCS rules, exclusion list, and cross-encoder test vectors the function must reproduce.
- `hash_algorithm_spec` (object, required): The hash function (SHA-256), digest length, and the pinned output encoding.
- `repo_path` (string, required): Path to the repository where the hashing module and its test are written.

---

## Outputs

- `rust_canonical_hasher` (object): The Rust module path, the exported function name, and the test result against the canonicalization test vectors.

---

## Phase 1: Install the JCS library and wire the hash

### Entry Criteria
- `repo_path` is a writable repository for the Rust stack.
- `canonicalization_spec` lists the test vectors.

### Actions
1. Add the JCS and hash crates: run `cargo add serde_jcs serde sha2 hex`. Confirm the serialize function name in the crate docs before use.
2. Write a function that takes the record object, removes the fields the exclusion list in `canonicalization_spec` names (at least `content_hash`), canonicalizes the rest with the JCS library, and hashes the resulting UTF-8 bytes with SHA-256.
3. Serialize the record with `serde_jcs::to_vec(&record)?` to get canonical bytes, then compute `sha2::Sha256::digest(&bytes)` and format with `hex::encode(...)`.
4. Return the digest in the encoding pinned by `hash_algorithm_spec` (for example lowercase hex), and do not re-encode or trim it afterward.
5. Do NOT hand-roll key sorting or your own canonicalizer when the library exists; a near-miss canonicalizer silently disagrees with other stacks. A maintained option is the `serde_jcs` crate, used with `serde` and `sha2`.

### Output
A hashing module exporting one function that maps a record to its content hash.

### Quality Gate
- The function removes every excluded field before canonicalizing.
- The digest is returned in the single encoding from `hash_algorithm_spec`.
- Canonicalization uses the named library, not a hand-written sort.

---

## Phase 2: Confirm against the cross-encoder vectors

### Entry Criteria
- The hashing module compiles or imports without error.

### Actions
1. Write a test that feeds each vector from `canonicalization_spec` through the function and asserts the canonical byte length and the content hash match the expected values.
2. Add a differential check: hash the same record twice with keys inserted in different orders and assert the two digests are identical, proving canonicalization removed key order.
3. Run the test and read the output; a pass means every vector reproduced. Do NOT delete or weaken a vector to make the test pass; a failing vector means the canonicalizer disagrees and must be fixed.
4. Record the module path, the function name, and the test command and result in `rust_canonical_hasher`.

### Output
`rust_canonical_hasher` with the test result and the module location.

### Quality Gate
- Every test vector from `canonicalization_spec` passes with the expected byte length and digest.
- The reordered-keys differential check yields identical digests.
- The recorded result comes from a run that was executed, not assumed.

---

## Worked Example

Input (illustrative): `repo_path` = ./audit, two vectors in `canonicalization_spec`.

Phase 2 run (illustrative):

```
cargo test canonical_hash -- --nocapture
vector 1 (non-ascii): byte_len=31 hash=... OK
vector 2 (large int): byte_len=27 hash=... OK
reordered-keys digests equal: OK
```

`rust_canonical_hasher` records module path, function name, and PASS.

---

## Exit Criteria

DONE when the Rust function reproduces every canonicalization test vector, the reordered-keys check gives identical digests, and `rust_canonical_hasher` records the module path and the executed test result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No maintained JCS library for the stack | **Stop**: report it as an open question; do not ship a hand-written canonicalizer that only approximates RFC 8785. |
| Phase 2 | A vector digest does not match | **Adjust**: compare the canonical bytes against the vector bytes to find the differing field, then fix the exclusion or number handling. |
| Phase 2 | The reordered-keys digests differ | **Retry**: the canonicalizer is not sorting keys; confirm the library is applied before hashing, not after. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
