# Drive Offload with Destination Verification

**One-line description:** Copies a hashed drive from the vehicle logger to the archive with `rsync` (local or SSH) or `rclone` (object storage), verifies every file at the destination against `SHA256SUMS`, and only then allows the vehicle copy to be freed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_dir` (string, required): The drive directory on the vehicle logger.
- `hash_manifest` (object, required): From `dlog-file-integrity-hashes`; includes the hash of `SHA256SUMS`.
- `archive_path` (string, required): Destination root, for example `/archive/drives`, `user@nas:/archive/drives`, or an rclone remote `s3remote:bucket/drives`.

---

## Outputs

- `offload_report` (object): Source and destination paths, bytes transferred, duration, verification command and result, and whether the source may be freed.

---

## Phase 1: Copy

### Entry Criteria
- `sha256sum -c SHA256SUMS` passes at the source.
- Destination free space exceeds `du -sb <log_dir>` (check with `df -B1` or the storage provider's quota).

### Actions
1. Filesystem or SSH destination: `rsync -a --partial --info=progress2 <log_dir>/ <archive_path>/<drive_id>/`. The trailing slash on the source copies the contents into the named directory.
2. Object storage: `rclone copy <log_dir> <archive_path>/<drive_id> --progress`. Check `rclone help flags` for checksum options your backend supports.
3. Do NOT use `mv`, `rsync --remove-source-files` or `rclone move`. Removing the source happens only after Phase 2 passes.
4. If the copy is interrupted, rerun the same command; `--partial` and rclone resume continue.

### Output
Destination copy.

### Quality Gate
- The copy command exits 0 (`echo $?`).
- Destination file count equals source file count (`find ... -type f | wc -l` or `rclone size`).

---

## Phase 2: Verify at Destination

### Entry Criteria
- Copy complete.

### Actions
1. Filesystem or SSH: on the destination host run `cd <archive_path>/<drive_id> && sha256sum -c SHA256SUMS`. Running it on the destination host reads the bytes that were actually stored.
2. Then `sha256sum SHA256SUMS` at the destination and compare with the hash in `hash_manifest`; equal means the hash list itself was not altered.
3. Object storage: `rclone check <log_dir> <archive_path>/<drive_id> --download` compares content byte for byte by downloading; or, if the backend stores SHA-256, `rclone hashsum sha256 <archive_path>/<drive_id>` and compare against `SHA256SUMS`. MD5 or ETag comparisons do not prove SHA-256 equality.
4. Make the destination read-only (filesystem `chmod -R a-w`, or the storage provider's object lock or retention setting if the user uses one).

### Output
Verification result.

### Quality Gate
- Every line of `sha256sum -c` at the destination is `OK`, or `rclone check` reports 0 differences.
- Destination `SHA256SUMS` hash equals the value in `hash_manifest`.

---

## Phase 3: Release the Source

### Entry Criteria
- Phase 2 passed.

### Actions
1. Record in `offload_report`: `source_may_be_freed = true` with the verification evidence.
2. Freeing space on the vehicle is a separate operator action under the user's retention rules; this flow does not delete.

### Output
`offload_report`.

### Quality Gate
- `source_may_be_freed` is true only when both Phase 2 gates passed.

---

## Worked Example

Illustrative.
```
$ rsync -a --partial --info=progress2 /data/drives/d2026_10_21_a/ nas:/archive/drives/d2026_10_21_a/
 41,873,220,104 100%  412.30MB/s    0:01:36 (xfr#9, to-chk=0/10)
$ ssh nas 'cd /archive/drives/d2026_10_21_a && sha256sum -c SHA256SUMS | grep -vc ": OK$"'
0
$ ssh nas 'sha256sum /archive/drives/d2026_10_21_a/SHA256SUMS'
9a0c...e41f
```

---

## Exit Criteria

DONE when the destination copy verifies against `SHA256SUMS` and the hash of `SHA256SUMS` matches the recorded value.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Destination full | **Stop**: free archive space; never drop files to fit. |
| Phase 1 | Connection drops | **Retry**: rerun the same command. |
| Phase 2 | A file fails `sha256sum -c` | **Retry**: re-copy that file with `rsync -a --checksum` and verify again; if it fails twice, **Return** a storage fault report. |
| Phase 2 | Backend offers no SHA-256 | **Adjust**: use `rclone check --download`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
