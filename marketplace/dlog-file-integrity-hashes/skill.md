# Per-File SHA-256 Integrity Manifest

**One-line description:** Computes a SHA-256 hash of every closed log file and the run manifest of a drive with `sha256sum`, writes a `SHA256SUMS` file, verifies it with `sha256sum -c`, and optionally signs it, so any later copy or edit of the drive is detectable.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_dir` (string, required): One drive's directory after `dlog-run-manifest` embedded metadata.
- `run_manifest` (object, required): From `dlog-run-manifest`; lists the files that belong to the drive.

---

## Outputs

- `hash_manifest` (object): Path of `SHA256SUMS`, number of files hashed, the hash of `SHA256SUMS` itself, the signature file path if signed, and the `sha256sum -c` result.

---

## Phase 1: Confirm Files Are Final

### Entry Criteria
- `run_manifest` lists every file in the drive.

### Actions
1. `lsof +D <log_dir>` must print nothing. A file still open for writing will change after hashing.
2. Compare the set of files on disk (`find <log_dir> -type f ! -name SHA256SUMS ! -name 'SHA256SUMS.*' | sort`) with the `files` list in `run_manifest`. Any extra or missing file is a defect.
3. Do NOT hash `.active` or temporary files; their presence means the recorder did not finish.

### Output
Final file list.

### Quality Gate
- `lsof +D <log_dir>` output is empty.
- The on-disk file set equals the manifest file set plus `run_manifest.json`.

---

## Phase 2: Hash and Verify

### Entry Criteria
- File list final.

### Actions
1. From inside `<log_dir>` so paths are relative: `cd <log_dir> && find . -type f ! -name SHA256SUMS ! -name 'SHA256SUMS.*' -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS`.
2. Verify immediately: `sha256sum -c SHA256SUMS`. Every line must end in `OK`.
3. `sha256sum SHA256SUMS` and record the result in `hash_manifest`; storing this value outside the drive (the drive index, a ticket) lets anyone detect a replaced SHA256SUMS.
4. Make the directory read-only: `chmod -R a-w <log_dir>`.
5. Note: MCAP also stores CRC32 values for chunks and the data section, which `mcap doctor` checks. CRC detects accidental corruption only; SHA-256 is the cross-copy identity check.

### Output
`SHA256SUMS` verified.

### Quality Gate
- `sha256sum -c SHA256SUMS` prints `OK` for every line and the number of lines equals the file count from Phase 1.

---

## Phase 3: Optional Signature

### Entry Criteria
- The user wants signed provenance and has a key.

### Actions
1. Sign with one of: `ssh-keygen -Y sign -f <private_key> -n file SHA256SUMS` (creates `SHA256SUMS.sig`), or `gpg --detach-sign --armor SHA256SUMS` (creates `SHA256SUMS.asc`).
2. Verify: `ssh-keygen -Y verify -f allowed_signers -I <identity> -n file -s SHA256SUMS.sig < SHA256SUMS`, or `gpg --verify SHA256SUMS.asc SHA256SUMS`.
3. Never store the private key in `log_dir` or in the archive.

### Output
`hash_manifest`.

### Quality Gate
- The verify command reports a good signature when Phase 3 runs; otherwise `hash_manifest` states "unsigned".

---

## Worked Example

Illustrative.
```
$ cd /data/drives/d2026_10_21_a && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
$ sha256sum -c SHA256SUMS
./metadata.yaml: OK
./part_0001.mcap: OK
./part_0002.mcap: OK
./run_manifest.json: OK
$ sha256sum SHA256SUMS
9a0c...e41f  SHA256SUMS
```

---

## Exit Criteria

DONE when every final file is in a verified `SHA256SUMS`, the hash of that file is recorded, and the directory is read-only.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A file is open | **Stop**: wait for the writer to close; never hash a growing file. |
| Phase 1 | File set differs from manifest | **Return**: to `dlog-run-manifest` to reconcile. |
| Phase 2 | `sha256sum -c` reports FAILED | **Stop**: the file changed between hash and check; find the writer, then rehash. |
| Phase 3 | Signature verify fails | **Stop**: check the key and identity; do not ship an unverifiable signature. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
