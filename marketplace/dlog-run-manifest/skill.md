# Drive Run Manifest

**One-line description:** Writes a `run_manifest.json` for one drive with the exact software version (git commit and dirty flag), calibration and config file hashes, sensor list, clock sync status and drive context, and embeds it in each MCAP file with `mcap add metadata` and `mcap add attachment` before any file hashing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_dir` (string, required): One drive's validated files.
- `run_context` (object, required): Facts the logger cannot read itself: drive purpose, route or area, operator pseudonym, vehicle internal id, weather, notes. Use pseudonyms, not names.

---

## Outputs

- `run_manifest` (object): The JSON manifest content and its path, plus a list of MCAP files that carry it as metadata.

---

## Phase 1: Collect Facts

### Entry Criteria
- `log_dir` passed `dlog-log-validate-recover`.

### Actions
1. Software version: in the stack's source tree, `git rev-parse HEAD` and `git status --porcelain`; dirty = output not empty. For ROS 2 workspaces also record `echo $ROS_DISTRO` and `ros2 pkg list` versions of drivers if pinned.
2. Calibration and configuration: `sha256sum` of every calibration file (camera intrinsics, extrinsics, lidar to vehicle transform) and every launch or parameter file used.
3. Time sync status: the summary lines from `dlog-ptp-linuxptp-sync` or `dlog-chrony-gnss-pps` for the drive period, or "unsynced".
4. Files: list of log files with size and first and last `log_time` (from `mcap info` or `ros2 bag info`).
5. Host: `uname -r`, hostname, logger version.
6. Copy `run_context` fields in. Do NOT store personal names, phone numbers or exact home addresses in the manifest.

### Output
Fact list.

### Quality Gate
- `git_commit` is a 40 character hex string and `git_dirty` is true or false.
- Every calibration file listed has a SHA-256.

---

## Phase 2: Write and Embed

### Entry Criteria
- Facts collected.

### Actions
1. Write `<log_dir>/run_manifest.json` with keys: `drive_id`, `schema_version`, `start_ns`, `end_ns`, `git_commit`, `git_dirty`, `ros_distro`, `calibration` (name to sha256), `config` (name to sha256), `time_sync`, `files`, `context`. Validate with `python -m json.tool run_manifest.json`.
2. Embed in each MCAP file (this rewrites the file, so do it before `dlog-file-integrity-hashes`):
   - `mcap add metadata <file> -n run_manifest -k drive_id=<id> -k git_commit=<sha> -k git_dirty=<bool>`
   - `mcap add attachment <file> -f run_manifest.json` (check `mcap add attachment --help` for the media type flag on your version).
3. If `log_dir` is read-only from the validation flow, make it writable only for this step and read-only again after.
4. For rosbag2 bags, `metadata.yaml` is managed by rosbag2; keep the manifest as a sibling file and embed into the `.mcap` files the same way.

### Output
`run_manifest`.

### Quality Gate
- `mcap list metadata <file>` shows `run_manifest` with the same `git_commit` on every MCAP file.
- `mcap doctor` exits 0 on every file after embedding.

---

## Worked Example

Illustrative.
```
$ git -C ~/stack rev-parse HEAD
4f1c2a9e8b7d6c5f4e3d2c1b0a9f8e7d6c5b4a39
$ git -C ~/stack status --porcelain | wc -l
0
$ mcap add metadata part_0001.mcap -n run_manifest -k drive_id=d2026_10_21_a -k git_commit=4f1c2a9e... -k git_dirty=false
$ mcap list metadata part_0001.mcap
run_manifest  {"drive_id":"d2026_10_21_a","git_commit":"4f1c2a9e...","git_dirty":"false"}
```

---

## Exit Criteria

DONE when `run_manifest.json` exists, is valid JSON, and every MCAP file carries the manifest metadata and passes `mcap doctor`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Software tree is dirty | **Return**: record `git_dirty=true` and `git diff` hash; do not hide it. |
| Phase 1 | Calibration file missing | **Stop**: a drive without its calibration cannot be replayed faithfully. |
| Phase 2 | `mcap add` not available in the installed CLI | **Adjust**: upgrade the `mcap` CLI from the foxglove/mcap releases, or write metadata with the Python writer into a new copy. |
| Phase 2 | Files already hashed | **Stop**: embedding changes the bytes; rerun `dlog-file-integrity-hashes` after this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
