# Ed25519 Signing Key Generation

**One-line description:** Generate an Ed25519 signing keypair for the log, derive a stable key_id from the public key, and set file permissions and a public-key distribution path so verifiers can trust future signatures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_requirements` (object, required): Integrity requirements that state whether signing is required and who verifies.
- `key_output_dir` (string, required): Directory where the private key, public key, and key_id file are written, outside any source repository.

---

## Outputs

- `signing_keypair` (object): The private key path, public key path, the derived key_id, and the algorithm, with permissions set.

---

## Phase 1: Generate the keypair

### Entry Criteria
- `log_requirements.signing_required` is true.
- `key_output_dir` exists and is not inside a source repository.

### Actions
1. Generate an Ed25519 private key. With OpenSSL: run `openssl genpkey -algorithm ed25519 -out audit_ed25519.pem`. Ed25519 has no parameters to choose, which removes a class of misconfiguration.
2. Extract the public key: run `openssl pkey -in audit_ed25519.pem -pubout -out audit_ed25519.pub.pem`.
3. As an alternative when a libsodium binding is already in the stack, generate the keypair with that binding (for example the signing keypair call in the language flow) and export the 32-byte public key; record which path was used.
4. Set private key permissions to owner read and write only: run `chmod 600 audit_ed25519.pem`. Do NOT commit the private key to the repository or copy it into build artifacts.

### Output
A private and public key file in `key_output_dir` with restrictive permissions.

### Quality Gate
- The algorithm is Ed25519 and the private key file permissions are owner-only.
- A public key file is exported next to the private key.
- The private key path is outside any source repository.

---

## Phase 2: Derive key_id and distribution

### Entry Criteria
- A keypair exists in `key_output_dir`.

### Actions
1. Derive a stable `key_id` from the public key so records and checkpoints can name the signing key: compute the SHA-256 of the raw public key bytes and take the first 16 hex characters, or use a dated label such as `2026-ed25519-a`; pin exactly one scheme.
2. Write a `key_id` file holding the id and the public key so a verifier can map a signature to a key without the private key.
3. State the public-key distribution path from `log_requirements`: where verifiers fetch the public key and how they confirm it (for example a checked-in public key file, reviewed by a second person).
4. Record `signing_keypair` with the private path, public path, `key_id`, and algorithm.

### Output
`signing_keypair` with the key_id and a stated public-key distribution path.

### Quality Gate
- `key_id` is derived by one pinned scheme and stored with the public key.
- A verifier can obtain the public key by the stated distribution path.
- `signing_keypair` records the private path, public path, key_id, and Ed25519 as the algorithm.

---

## Worked Example

Input (illustrative): `key_output_dir` = /etc/audit/keys.

Phase 1 and 2 run (illustrative):

```
openssl genpkey -algorithm ed25519 -out /etc/audit/keys/audit_ed25519.pem
openssl pkey -in .../audit_ed25519.pem -pubout -out /etc/audit/keys/audit_ed25519.pub.pem
chmod 600 /etc/audit/keys/audit_ed25519.pem
key_id = 2026-ed25519-a
```

`signing_keypair` records both paths, the key_id, and algorithm Ed25519.

---

## Exit Criteria

DONE when an Ed25519 keypair exists in `key_output_dir` with owner-only private permissions, a `key_id` is derived by one scheme and stored with the public key, and `signing_keypair` records the distribution path.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `key_output_dir` is inside a git repository | **Stop**: move it outside the repo or the private key risks being committed; do not generate there. |
| Phase 1 | OpenSSL version does not list ed25519 | **Retry**: check `openssl list -public-key-algorithms` or the language binding; do not substitute a different algorithm without recording it. |
| Phase 2 | No agreed way for verifiers to get the public key | **Return**: record the distribution path as an open question for the operator before signing goes live. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
