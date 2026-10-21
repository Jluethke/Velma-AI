# Python Ed25519 Sign and Verify

**One-line description:** Implement Python functions that sign a record or checkpoint with the Ed25519 private key and verify a signature with the public key, over the exact canonical bytes, with a round-trip and a tamper test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `signing_keypair` (object, required): The private key, public key, key_id, and algorithm produced by the key generation flow.
- `chain_link_spec` (object, required): The linkage rules, so the signer knows which bytes (canonical record or checkpoint) are signed.
- `repo_path` (string, required): Path to the repository where the sign and verify module and its tests are written.

---

## Outputs

- `py_signer` (object): The Python module path, the sign and verify function names, and the result of the round-trip and tamper tests.

---

## Phase 1: Sign over canonical bytes

### Entry Criteria
- `signing_keypair` gives the private and public key paths.
- `repo_path` is writable for the Python stack.

### Actions
1. Install a signing library: use the standard `cryptography` package (`pip install cryptography`), or `pip install pynacl` for the libsodium binding. Confirm the import names in the library docs.
2. Write a sign function that takes the canonical bytes of the record or checkpoint (the same bytes the content hash covers, never a language object) and returns the Ed25519 signature.
3. With `cryptography`: load the key with `serialization.load_pem_private_key(...)`, then `private_key.sign(message_bytes)` returns the 64-byte signature (Ed25519 takes no hash argument).
4. State clearly what is signed: sign the canonical serialization, not a re-stringified object, so the verifier hashes and checks the identical bytes.
5. Attach the `key_id` from `signing_keypair` alongside the signature so a verifier selects the right public key, especially after rotation.

### Output
A sign function returning a signature plus the key_id.

### Quality Gate
- The function signs the canonical bytes, not a re-serialized object.
- The signature is produced with the Ed25519 private key from `signing_keypair`.
- The `key_id` travels with the signature.

---

## Phase 2: Verify and tamper test

### Entry Criteria
- The sign function exists.

### Actions
1. With `cryptography`: `public_key.verify(signature, message_bytes)` raises `InvalidSignature` on failure; treat the raised exception as the failed-verify result, do not swallow it.
2. Write a round-trip test: sign a record, verify it with the public key, and assert verification passes.
3. Write a tamper test: flip one byte of the signed canonical content, verify again, and assert verification fails; also assert that verifying with the wrong public key fails.
4. Run both tests and read the output. Do NOT catch and ignore a verification failure to make a test green; a failed verify on tampered input is the success condition.
5. Record the module path, function names, and the test result in `py_signer`.

### Output
`py_signer` with passing round-trip and failing-on-tamper results.

### Quality Gate
- The round-trip test verifies a genuine signature as valid.
- The tamper test and the wrong-key test both report verification failure.
- Results come from an executed run recorded in `py_signer`.

---

## Worked Example

Input (illustrative): `signing_keypair` from /etc/audit/keys.

Phase 2 run (illustrative):

```
python -m pytest tests/test_signer.py -q
round-trip verify: VALID
one-byte tamper verify: INVALID (expected)
wrong-key verify: INVALID (expected)
```

`py_signer` records module path, sign and verify names, and PASS.

---

## Exit Criteria

DONE when the Python sign function signs canonical bytes with the key_id attached, the verify function passes a genuine signature and fails tampered input and a wrong key, and `py_signer` records the executed results.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The function signs a re-serialized object | **Adjust**: sign the exact canonical bytes so the verifier checks identical input; a re-serialize can change bytes. |
| Phase 2 | Tamper test still verifies as valid | **Stop**: the signature is not covering the tampered field; confirm the signed bytes include that field before proceeding. |
| Phase 2 | The verify step cannot find the public key | **Return**: resolve the public key by `key_id` from `signing_keypair`; do not skip verification. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
